import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Play, Pause, Square, RotateCcw, Settings, Coffee, Target, 
  TrendingUp, Calendar, Clock, Zap, Award, Volume2, VolumeX,
  CheckCircle2, BarChart3, List, Hash, Maximize, Bell, BellOff,
  Music, Save, Download, Upload, Flame, Trophy, BookOpen,
  Sparkles, Eye, Activity, Brain, Focus, Star, Timer, Trash2
} from "lucide-react";

type PomodoroPhase = "work" | "short-break" | "long-break";
type SessionStatus = "completed" | "interrupted" | "skipped";
type SoundTheme = "default" | "gentle" | "bell" | "chime" | "none";
type PresetType = "classic" | "short" | "long" | "ultra" | "custom";

interface PomodoroSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  soundEnabled: boolean;
  soundTheme: SoundTheme;
  notificationsEnabled: boolean;
  tickingSound: boolean;
  dailyGoal: number;
}

interface SessionHistoryItem {
  id: string;
  phase: PomodoroPhase;
  duration: number;
  completedAt: Date;
  status: SessionStatus;
  task?: string;
  notes?: string;
  tags: string[];
}

interface TimerPreset {
  name: string;
  type: PresetType;
  work: number;
  shortBreak: number;
  longBreak: number;
  cycles: number;
}

const PRESETS: TimerPreset[] = [
  { name: "Classic Pomodoro", type: "classic", work: 25, shortBreak: 5, longBreak: 15, cycles: 4 },
  { name: "Short Sprint", type: "short", work: 15, shortBreak: 3, longBreak: 10, cycles: 4 },
  { name: "Deep Focus", type: "long", work: 50, shortBreak: 10, longBreak: 30, cycles: 3 },
  { name: "Ultra Focus", type: "ultra", work: 90, shortBreak: 15, longBreak: 45, cycles: 2 },
];

export default function PomodoroTool() {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState<PomodoroPhase>("work");
  const [timeRemaining, setTimeRemaining] = useState(25 * 60);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [sessionHistory, setSessionHistory] = useState<SessionHistoryItem[]>([]);
  const [currentTask, setCurrentTask] = useState("");
  const [sessionNotes, setSessionNotes] = useState("");
  const [sessionTags, setSessionTags] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<PresetType>("classic");
  const [dailyStreak, setDailyStreak] = useState(0);
  
  const [settings, setSettings] = useState<PomodoroSettings>({
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
    autoStartBreaks: false,
    autoStartPomodoros: false,
    soundEnabled: true,
    soundTheme: "default",
    notificationsEnabled: true,
    tickingSound: false,
    dailyGoal: 8,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const tickingRef = useRef<NodeJS.Timeout | null>(null);

  // Load data from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('pomodoro-history');
    const savedSettings = localStorage.getItem('pomodoro-settings');
    const savedStreak = localStorage.getItem('pomodoro-streak');
    
    if (savedHistory) {
      setSessionHistory(JSON.parse(savedHistory).map((item: any) => ({
        ...item,
        completedAt: new Date(item.completedAt)
      })));
    }
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
    if (savedStreak) {
      setDailyStreak(parseInt(savedStreak));
    }
  }, []);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('pomodoro-history', JSON.stringify(sessionHistory));
    localStorage.setItem('pomodoro-settings', JSON.stringify(settings));
    localStorage.setItem('pomodoro-streak', dailyStreak.toString());
  }, [sessionHistory, settings, dailyStreak]);

  // Main timer
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handlePhaseComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Ticking sound
      if (settings.tickingSound && phase === "work") {
        tickingRef.current = setInterval(() => {
          playTickSound();
        }, 1000);
      }
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (tickingRef.current) clearInterval(tickingRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (tickingRef.current) clearInterval(tickingRef.current);
    };
  }, [isRunning, settings.tickingSound, phase]);

  const handlePhaseComplete = () => {
    const currentPhase = phase;
    const duration = getCurrentPhaseDuration();
    
    // Save to history
    const historyItem: SessionHistoryItem = {
      id: Date.now().toString(),
      phase: currentPhase,
      duration: duration / 60,
      completedAt: new Date(),
      status: "completed",
      task: currentTask || undefined,
      notes: sessionNotes || undefined,
      tags: sessionTags,
    };
    
    setSessionHistory(prev => [historyItem, ...prev].slice(0, 100));
    
    // Play sound
    if (settings.soundEnabled) {
      playNotificationSound(settings.soundTheme);
    }
    
    // Show notification
    if (settings.notificationsEnabled) {
      showNotification();
    }
    
    // Update streak and sessions
    if (currentPhase === "work") {
      const newCompletedSessions = completedSessions + 1;
      setCompletedSessions(newCompletedSessions);
      
      // Check daily goal
      const today = new Date().toDateString();
      const todaySessions = sessionHistory.filter(s => 
        s.phase === "work" && 
        new Date(s.completedAt).toDateString() === today
      ).length + 1;
      
      if (todaySessions >= settings.dailyGoal) {
        toast({
          title: "🎉 Daily Goal Achieved!",
          description: `You've completed ${todaySessions} sessions today!`,
        });
        setDailyStreak(prev => prev + 1);
      }
      
      // Determine next phase
      if (newCompletedSessions % settings.sessionsUntilLongBreak === 0) {
        setPhase("long-break");
        setTimeRemaining(settings.longBreakDuration * 60);
      } else {
        setPhase("short-break");
        setTimeRemaining(settings.shortBreakDuration * 60);
      }
      
      // Auto-start break
      if (settings.autoStartBreaks) {
        setIsRunning(true);
      } else {
        setIsRunning(false);
      }
    } else {
      // Break completed
      setPhase("work");
      setTimeRemaining(settings.workDuration * 60);
      setCurrentTask("");
      setSessionNotes("");
      
      // Auto-start work
      if (settings.autoStartPomodoros) {
        setIsRunning(true);
      } else {
        setIsRunning(false);
      }
    }
  };

  const playTickSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.05);
    } catch (error) {
      // Silent fail
    }
  };

  const playNotificationSound = (theme: SoundTheme) => {
    if (theme === "none") return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const soundPatterns: { [key in SoundTheme]: number[] } = {
        default: [523, 659, 784],
        gentle: [440, 554, 659],
        bell: [659, 784, 880, 1047],
        chime: [523, 659, 784, 880, 1047],
        none: []
      };
      
      const frequencies = phase === "work" 
        ? soundPatterns[theme] 
        : soundPatterns[theme].slice(0, 2);
      
      frequencies.forEach((freq, index) => {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = freq;
          oscillator.type = theme === "bell" ? 'sine' : 'triangle';
          
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.5);
        }, index * 200);
      });
    } catch (error) {
      console.log('Audio not available');
    }
  };

  const showNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const title = phase === "work" 
        ? "🎉 Work Session Complete!" 
        : "⏰ Break Time Over!";
      const body = phase === "work" 
        ? `Great job! Time for a ${(completedSessions + 1) % settings.sessionsUntilLongBreak === 0 ? 'long' : 'short'} break.`
        : "Ready to focus? Let's get back to work!";
      
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'pomodoro-timer'
      });
    }
  };

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          toast({
            title: "Notifications Enabled",
            description: "You'll be notified when sessions complete",
          });
        }
      });
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    setIsRunning(true);
    if (settings.notificationsEnabled) {
      requestNotificationPermission();
    }
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeRemaining(getCurrentPhaseDuration());
  };

  const skipPhase = () => {
    // Save as skipped
    const historyItem: SessionHistoryItem = {
      id: Date.now().toString(),
      phase,
      duration: (getCurrentPhaseDuration() - timeRemaining) / 60,
      completedAt: new Date(),
      status: "skipped",
      task: currentTask || undefined,
      notes: sessionNotes || undefined,
      tags: sessionTags,
    };
    
    setSessionHistory(prev => [historyItem, ...prev].slice(0, 100));
    handlePhaseComplete();
  };

  const applyPreset = (presetType: PresetType) => {
    const preset = PRESETS.find(p => p.type === presetType);
    if (preset) {
      setSettings({
        ...settings,
        workDuration: preset.work,
        shortBreakDuration: preset.shortBreak,
        longBreakDuration: preset.longBreak,
        sessionsUntilLongBreak: preset.cycles,
      });
      setSelectedPreset(presetType);
      setTimeRemaining(preset.work * 60);
      setPhase("work");
      setIsRunning(false);
    }
  };

  const getCurrentPhaseDuration = () => {
    switch (phase) {
      case "work": return settings.workDuration * 60;
      case "short-break": return settings.shortBreakDuration * 60;
      case "long-break": return settings.longBreakDuration * 60;
    }
  };

  const progress = ((getCurrentPhaseDuration() - timeRemaining) / getCurrentPhaseDuration()) * 100;

  // Statistics
  const today = new Date().toDateString();
  const todaySessions = sessionHistory.filter(s => 
    s.phase === "work" && 
    s.status === "completed" &&
    new Date(s.completedAt).toDateString() === today
  ).length;

  const todayFocusTime = sessionHistory
    .filter(s => s.phase === "work" && new Date(s.completedAt).toDateString() === today)
    .reduce((sum, s) => sum + s.duration, 0);

  const totalSessions = sessionHistory.filter(s => s.phase === "work" && s.status === "completed").length;
  const totalFocusTime = sessionHistory
    .filter(s => s.phase === "work")
    .reduce((sum, s) => sum + s.duration, 0);

  const phaseConfig = {
    work: {
      title: "Focus Time",
      description: "Time to concentrate and get work done",
      gradient: "from-red-500 to-orange-500",
      bgGradient: "from-red-50 to-orange-50",
      icon: Target,
    },
    "short-break": {
      title: "Short Break",
      description: "Take a quick break to recharge",
      gradient: "from-green-500 to-emerald-500",
      bgGradient: "from-green-50 to-emerald-50",
      icon: Coffee,
    },
    "long-break": {
      title: "Long Break",
      description: "Take a longer break to fully recharge",
      gradient: "from-blue-500 to-indigo-500",
      bgGradient: "from-blue-50 to-indigo-50",
      icon: Coffee,
    },
  };

  const currentConfig = phaseConfig[phase];
  const IconComponent = currentConfig.icon;

  // Focus mode render
  if (focusMode) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${currentConfig.bgGradient} flex items-center justify-center p-4`}>
        <div className="max-w-4xl w-full space-y-8 text-center">
          <Badge variant="outline" className="text-xl px-6 py-2">
            {currentConfig.title}
          </Badge>
          
          <div className={`text-9xl md:text-[12rem] font-mono font-bold bg-gradient-to-r ${currentConfig.gradient} bg-clip-text text-transparent`}>
            {formatTime(timeRemaining)}
          </div>
          
          <Progress value={progress} className="h-4 w-full max-w-2xl mx-auto" />
          
          <div className="flex justify-center gap-4">
            {!isRunning ? (
              <Button size="lg" onClick={startTimer} className="text-xl px-8 py-6">
                <Play className="w-8 h-8 mr-2" />
                Start
              </Button>
            ) : (
              <Button size="lg" variant="outline" onClick={pauseTimer} className="text-xl px-8 py-6">
                <Pause className="w-8 h-8 mr-2" />
                Pause
              </Button>
            )}
            
            <Button size="lg" variant="outline" onClick={() => setFocusMode(false)} className="text-xl px-8 py-6">
              <Eye className="w-8 h-8 mr-2" />
              Exit Focus
            </Button>
          </div>
          
          {currentTask && (
            <div className="text-2xl text-slate-700 font-medium max-w-2xl mx-auto">
              Working on: {currentTask}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Timer className="w-8 h-8 text-red-500" />
            Pomodoro Pro
          </h2>
          <p className="text-slate-600 mt-1">Advanced focus timer with analytics and insights</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <Tabs defaultValue="timer" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="timer">
            <Clock className="w-4 h-4 mr-2" />
            Timer
          </TabsTrigger>
          <TabsTrigger value="statistics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Statistics
          </TabsTrigger>
          <TabsTrigger value="history">
            <Calendar className="w-4 h-4 mr-2" />
            History
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Timer Tab */}
        <TabsContent value="timer" className="space-y-6 mt-6">
          {/* Preset Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Timer Presets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {PRESETS.map(preset => (
                  <Button
                    key={preset.type}
                    variant={selectedPreset === preset.type ? "default" : "outline"}
                    onClick={() => applyPreset(preset.type)}
                    className="h-auto py-3 flex flex-col items-center"
                  >
                    <div className="font-semibold">{preset.name}</div>
                    <div className="text-xs text-slate-500">
                      {preset.work}/{preset.shortBreak}/{preset.longBreak}
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Main Timer */}
          <Card className={`bg-gradient-to-br ${currentConfig.bgGradient} border-2`}>
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-3">
                    <IconComponent className="w-8 h-8" />
                    <Badge variant="outline" className="text-xl px-6 py-2">
                      {currentConfig.title}
                    </Badge>
                  </div>
                  
                  <div className="text-8xl md:text-9xl font-mono font-bold text-slate-900">
                    {formatTime(timeRemaining)}
                  </div>
                  
                  <p className="text-lg text-slate-600">{currentConfig.description}</p>
                  
                  <Progress value={progress} className="h-4" />
                  
                  {/* Task Input */}
                  {phase === "work" && !isRunning && (
                    <div className="max-w-2xl mx-auto">
                      <Input
                        placeholder="What are you working on? (optional)"
                        value={currentTask}
                        onChange={(e) => setCurrentTask(e.target.value)}
                        className="text-center text-lg"
                      />
                    </div>
                  )}
                  
                  {currentTask && isRunning && (
                    <div className="text-xl font-medium text-slate-700">
                      Working on: {currentTask}
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="flex justify-center gap-3 flex-wrap">
                  {!isRunning ? (
                    <Button size="lg" onClick={startTimer} disabled={timeRemaining === 0}>
                      <Play className="w-6 h-6 mr-2" />
                      Start
                    </Button>
                  ) : (
                    <Button size="lg" variant="outline" onClick={pauseTimer}>
                      <Pause className="w-6 h-6 mr-2" />
                      Pause
                    </Button>
                  )}
                  
                  <Button size="lg" variant="outline" onClick={resetTimer}>
                    <RotateCcw className="w-6 h-6 mr-2" />
                    Reset
                  </Button>
                  
                  <Button size="lg" variant="outline" onClick={skipPhase}>
                    <Square className="w-6 h-6 mr-2" />
                    Skip
                  </Button>
                  
                  <Button size="lg" variant="outline" onClick={() => setFocusMode(true)}>
                    <Maximize className="w-6 h-6 mr-2" />
                    Focus Mode
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Today's Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{todaySessions}</div>
                <Progress value={(todaySessions / settings.dailyGoal) * 100} className="h-2 mt-2" />
                <p className="text-xs text-slate-500 mt-1">Goal: {settings.dailyGoal}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  Focus Time Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{Math.round(todayFocusTime)} min</div>
                <p className="text-xs text-slate-500 mt-1">
                  {(todayFocusTime / 60).toFixed(1)} hours
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Hash className="w-4 h-4 text-purple-500" />
                  Current Cycle
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {(completedSessions % settings.sessionsUntilLongBreak) + 1}/{settings.sessionsUntilLongBreak}
                </div>
                <p className="text-xs text-slate-500 mt-1">Sessions until long break</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  Daily Streak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{dailyStreak}</div>
                <p className="text-xs text-slate-500 mt-1">Days in a row</p>
              </CardContent>
            </Card>
          </div>

          {/* Session Progress Visual */}
          <Card>
            <CardHeader>
              <CardTitle>Cycle Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {Array.from({ length: settings.sessionsUntilLongBreak }, (_, index) => (
                  <div
                    key={index}
                    className={`flex-1 h-4 rounded-full transition-all ${
                      index < (completedSessions % settings.sessionsUntilLongBreak)
                        ? "bg-green-500"
                        : index === (completedSessions % settings.sessionsUntilLongBreak) && phase === "work" && isRunning
                        ? "bg-yellow-500 animate-pulse"
                        : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-sm text-slate-500 mt-3">
                <span>Pomodoro {completedSessions % settings.sessionsUntilLongBreak + 1}</span>
                <span>Next: {
                  phase === "work" 
                    ? (completedSessions + 1) % settings.sessionsUntilLongBreak === 0 
                      ? `Long Break (${settings.longBreakDuration}m)` 
                      : `Short Break (${settings.shortBreakDuration}m)`
                    : `Work Session (${settings.workDuration}m)`
                }</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics" className="space-y-6 mt-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Total Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{totalSessions}</div>
                <p className="text-sm text-slate-600 mt-1">Completed work sessions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-500" />
                  Total Focus Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{(totalFocusTime / 60).toFixed(1)}h</div>
                <p className="text-sm text-slate-600 mt-1">{Math.round(totalFocusTime)} minutes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Completion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">
                  {totalSessions > 0 
                    ? Math.round((sessionHistory.filter(s => s.status === "completed").length / sessionHistory.length) * 100)
                    : 0}%
                </div>
                <p className="text-sm text-slate-600 mt-1">Sessions completed</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Weekly Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 7 }, (_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() - i);
                  const dateStr = date.toDateString();
                  const daySessions = sessionHistory.filter(s => 
                    s.phase === "work" && 
                    s.status === "completed" &&
                    new Date(s.completedAt).toDateString() === dateStr
                  ).length;
                  
                  return (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-24 text-sm text-slate-600">
                        {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                      <div className="flex-1">
                        <Progress value={(daySessions / settings.dailyGoal) * 100} className="h-3" />
                      </div>
                      <div className="w-16 text-sm font-medium text-right">
                        {daySessions} / {settings.dailyGoal}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Session History</span>
                <Badge variant="outline">{sessionHistory.length} total</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sessionHistory.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p>No sessions recorded yet</p>
                  <p className="text-sm mt-2">Start your first pomodoro to see history here</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {sessionHistory.map((session) => (
                    <div 
                      key={session.id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={
                            session.status === "completed" ? "default" :
                            session.status === "interrupted" ? "destructive" :
                            "secondary"
                          }>
                            {session.phase}
                          </Badge>
                          <span className="text-sm text-slate-600">
                            {new Date(session.completedAt).toLocaleString()}
                          </span>
                        </div>
                        {session.task && (
                          <div className="text-sm font-medium">{session.task}</div>
                        )}
                        {session.notes && (
                          <div className="text-xs text-slate-500 mt-1">{session.notes}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{Math.round(session.duration)}m</div>
                        <div className="text-xs text-slate-500">{session.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Timer Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Work Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={settings.workDuration}
                    onChange={(e) => setSettings({ ...settings, workDuration: parseInt(e.target.value) || 25 })}
                    min="1"
                    max="120"
                  />
                </div>
                <div>
                  <Label>Short Break (minutes)</Label>
                  <Input
                    type="number"
                    value={settings.shortBreakDuration}
                    onChange={(e) => setSettings({ ...settings, shortBreakDuration: parseInt(e.target.value) || 5 })}
                    min="1"
                    max="30"
                  />
                </div>
                <div>
                  <Label>Long Break (minutes)</Label>
                  <Input
                    type="number"
                    value={settings.longBreakDuration}
                    onChange={(e) => setSettings({ ...settings, longBreakDuration: parseInt(e.target.value) || 15 })}
                    min="1"
                    max="60"
                  />
                </div>
                <div>
                  <Label>Sessions Until Long Break</Label>
                  <Input
                    type="number"
                    value={settings.sessionsUntilLongBreak}
                    onChange={(e) => setSettings({ ...settings, sessionsUntilLongBreak: parseInt(e.target.value) || 4 })}
                    min="2"
                    max="10"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="text-base">Auto-Start Options</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="auto-breaks"
                    checked={settings.autoStartBreaks}
                    onCheckedChange={(checked) => setSettings({ ...settings, autoStartBreaks: checked === true })}
                  />
                  <Label htmlFor="auto-breaks" className="font-normal">
                    Auto-start breaks
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="auto-pomodoros"
                    checked={settings.autoStartPomodoros}
                    onCheckedChange={(checked) => setSettings({ ...settings, autoStartPomodoros: checked === true })}
                  />
                  <Label htmlFor="auto-pomodoros" className="font-normal">
                    Auto-start pomodoros
                  </Label>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="text-base">Sound & Notifications</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sound-enabled"
                    checked={settings.soundEnabled}
                    onCheckedChange={(checked) => setSettings({ ...settings, soundEnabled: checked === true })}
                  />
                  <Label htmlFor="sound-enabled" className="font-normal">
                    Enable completion sound
                  </Label>
                </div>
                
                {settings.soundEnabled && (
                  <div>
                    <Label>Sound Theme</Label>
                    <Select 
                      value={settings.soundTheme}
                      onValueChange={(value: SoundTheme) => setSettings({ ...settings, soundTheme: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="gentle">Gentle</SelectItem>
                        <SelectItem value="bell">Bell</SelectItem>
                        <SelectItem value="chime">Chime</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="notifications"
                    checked={settings.notificationsEnabled}
                    onCheckedChange={(checked) => setSettings({ ...settings, notificationsEnabled: checked === true })}
                  />
                  <Label htmlFor="notifications" className="font-normal">
                    Enable browser notifications
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ticking"
                    checked={settings.tickingSound}
                    onCheckedChange={(checked) => setSettings({ ...settings, tickingSound: checked === true })}
                  />
                  <Label htmlFor="ticking" className="font-normal">
                    Enable ticking sound during work
                  </Label>
                </div>
              </div>

              <Separator />

              <div>
                <Label>Daily Session Goal</Label>
                <Input
                  type="number"
                  value={settings.dailyGoal}
                  onChange={(e) => setSettings({ ...settings, dailyGoal: parseInt(e.target.value) || 8 })}
                  min="1"
                  max="20"
                />
                <p className="text-xs text-slate-500 mt-1">Number of pomodoros to complete each day</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  const data = { settings, history: sessionHistory, streak: dailyStreak };
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `pomodoro-data-${Date.now()}.json`;
                  a.click();
                  toast({ title: "Data exported!", description: "Your Pomodoro data has been downloaded" });
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  if (confirm('This will clear all your session history. Continue?')) {
                    setSessionHistory([]);
                    toast({ title: "History cleared", description: "All session history has been deleted" });
                  }
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear History
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
