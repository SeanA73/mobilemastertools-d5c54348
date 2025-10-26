import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, differenceInSeconds, parseISO } from "date-fns";
import { 
  Play, Pause, Square, Plus, Trash2, Clock, BarChart3, 
  Settings, Timer, Edit, Save, X, Search, Filter,
  ArrowUpDown, TrendingUp, AlertTriangle, Zap, Target,
  DollarSign, Calendar, User, Tag, PieChart, Activity
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertProjectSchema, insertTimeEntrySchema, type Project, type TimeEntry, type TaskTemplate } from "@shared/schema";

interface QuickSwitcherProps {
  projects: Project[];
  onSwitch: (projectId: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

function QuickSwitcher({ projects, onSwitch, isOpen, onClose }: QuickSwitcherProps) {
  const [search, setSearch] = useState("");
  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const switchTask = (projectId: number) => {
    onSwitch(projectId);
    onClose();
    setSearch("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Quick Switch Project</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <Input
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4"
          autoFocus
        />
        
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {filteredProjects.map((project) => (
            <Button
              key={project.id}
              variant="ghost"
              className="w-full justify-start"
              onClick={() => switchTask(project.id)}
            >
              <div 
                className="w-3 h-3 rounded-full mr-3"
                style={{ backgroundColor: project.color || '#3b82f6' }}
              />
              {project.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface IdlePromptProps {
  isOpen: boolean;
  idleDuration: number;
  onKeep: () => void;
  onDiscard: () => void;
  onCategorize: (category: string) => void;
}

function IdlePrompt({ isOpen, idleDuration, onKeep, onDiscard, onCategorize }: IdlePromptProps) {
  const [category, setCategory] = useState("");
  const idleMinutes = Math.floor(idleDuration / 60);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
        <div className="text-center mb-4">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
          <h3 className="text-lg font-semibold">Idle Time Detected</h3>
          <p className="text-gray-600 dark:text-gray-400">
            You were idle for {idleMinutes} minutes. What would you like to do with this time?
          </p>
        </div>
        
        <div className="space-y-3">
          <Button onClick={onKeep} className="w-full">
            Keep as work time
          </Button>
          
          <Button onClick={onDiscard} variant="outline" className="w-full">
            Discard idle time
          </Button>
          
          <div className="flex gap-2">
            <Input
              placeholder="Break, meeting, etc."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={() => onCategorize(category)} 
              disabled={!category.trim()}
            >
              Categorize
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SmartSuggestionsProps {
  recentTasks: TaskTemplate[];
  onSelect: (task: TaskTemplate) => void;
}

function SmartSuggestions({ recentTasks, onSelect }: SmartSuggestionsProps) {
  return (
    <div className="border rounded-lg p-3">
      <h4 className="text-sm font-medium mb-2">Recent Tasks</h4>
      <div className="space-y-1">
        {recentTasks.map((task) => (
          <Button
            key={task.id}
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sm"
            onClick={() => onSelect(task)}
          >
            <Clock className="h-3 w-3 mr-2" />
            {task.name}
            {task.estimatedDuration && (
              <span className="ml-auto text-xs text-gray-500">
                ~{task.estimatedDuration}min
              </span>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}

export default function EnhancedProjectTimer() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"timer" | "projects" | "reports" | "insights">("timer");
  const [activeProject, setActiveProject] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showQuickSwitcher, setShowQuickSwitcher] = useState(false);
  const [showIdlePrompt, setShowIdlePrompt] = useState(false);
  const [idleDuration, setIdleDuration] = useState(0);
  const [lastActivity, setLastActivity] = useState(Date.now());
  
  // Local storage for projects and time entries (fallback when no database)
  const [localProjects, setLocalProjects] = useState<Project[]>([]);
  const [localTimeEntries, setLocalTimeEntries] = useState<TimeEntry[]>([]);
  
  // Load from localStorage on mount
  useEffect(() => {
    const storedProjects = localStorage.getItem('project-timer-projects');
    const storedEntries = localStorage.getItem('project-timer-entries');
    
    if (storedProjects) {
      try {
        const parsed = JSON.parse(storedProjects);
        setLocalProjects(parsed.map((p: any) => ({
          ...p,
          deadlineDate: p.deadlineDate ? new Date(p.deadlineDate) : null,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
        })));
      } catch (e) {
        console.error('Failed to load projects from localStorage');
      }
    }
    
    if (storedEntries) {
      try {
        const parsed = JSON.parse(storedEntries);
        setLocalTimeEntries(parsed.map((e: any) => ({
          ...e,
          startTime: new Date(e.startTime),
          endTime: e.endTime ? new Date(e.endTime) : null,
          createdAt: new Date(e.createdAt),
          updatedAt: new Date(e.updatedAt),
        })));
      } catch (e) {
        console.error('Failed to load time entries from localStorage');
      }
    }
  }, []);
  
  // Save to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('project-timer-projects', JSON.stringify(localProjects));
  }, [localProjects]);
  
  useEffect(() => {
    localStorage.setItem('project-timer-entries', JSON.stringify(localTimeEntries));
  }, [localTimeEntries]);
  const [newProjectForm, setNewProjectForm] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
    billableRate: 0,
    isBillable: false,
    clientName: "",
  });
  const [manualEntryForm, setManualEntryForm] = useState({
    taskName: "",
    description: "",
    duration: "",
    date: format(new Date(), "yyyy-MM-dd"),
  });

  const intervalRef = useRef<NodeJS.Timeout>();
  const idleCheckRef = useRef<NodeJS.Timeout>();

  // Queries (with localStorage fallback)
  const { data: serverProjects = [] } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: () => apiRequest("GET", "/api/projects").then(res => res.json()).catch(() => [])
  });
  
  const { data: serverTimeEntries = [] } = useQuery({
    queryKey: ["/api/time-entries"],
    queryFn: () => apiRequest("GET", "/api/time-entries").then(res => res.json()).catch(() => [])
  });
  
  // Use server data if available, otherwise use localStorage
  const projects = serverProjects.length > 0 ? serverProjects : localProjects;
  const allTimeEntries = serverTimeEntries.length > 0 ? serverTimeEntries : localTimeEntries;

  const { data: activeEntry } = useQuery({
    queryKey: ["/api/time-entries/active"],
  });

  const { data: recentTasks = [] } = useQuery({
    queryKey: ["/api/task-templates/recent"],
  });

  const { data: insights } = useQuery({
    queryKey: ["/api/time-insights"],
  });

  // Mutations (with localStorage)
  const createProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      // Always use localStorage
      const newProject: Project = {
        id: Date.now(),
        userId: 'local-user',
        name: data.name,
        description: data.description || null,
        color: data.color || '#3b82f6',
        billableRate: data.billableRate || 0,
        isBillable: data.isBillable || false,
        clientName: data.clientName || null,
        status: 'active',
        tags: [],
        estimatedHours: null,
        deadlineDate: null,
        priority: 'medium',
        integrationData: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setLocalProjects(prev => [newProject, ...prev]);
      return newProject;
    },
    onSuccess: () => {
      setNewProjectForm({
        name: "",
        description: "",
        color: "#3b82f6",
        billableRate: 0,
        isBillable: false,
        clientName: "",
      });
      toast({ title: "Project created successfully ✓" });
    },
  });

  const startTimerMutation = useMutation({
    mutationFn: async (data: any) => {
      // Start timer in localStorage
      const newEntry: TimeEntry = {
        id: Date.now(),
        userId: 'local-user',
        projectId: data.projectId,
        taskName: data.taskName || null,
        description: null,
        startTime: new Date(),
        endTime: null,
        duration: 0,
        isManual: false,
        isBillable: false,
        hourlyRate: 0,
        tags: [],
        metadata: null,
        idleTime: 0,
        isActive: true,
        predictedCategory: null,
        confidenceScore: null,
        anomalyFlags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setLocalTimeEntries(prev => [newEntry, ...prev]);
      return newEntry;
    },
    onSuccess: () => {
      setIsRunning(true);
      toast({ title: "Timer started ✓" });
    },
  });

  const stopTimerMutation = useMutation({
    mutationFn: async (data: any) => {
      // Stop timer in localStorage
      const endTime = new Date();
      setLocalTimeEntries(prev => prev.map(entry =>
        entry.isActive && entry.projectId === data.projectId
          ? {
              ...entry,
              endTime,
              duration: Math.floor((endTime.getTime() - entry.startTime.getTime()) / 1000),
              isActive: false,
              updatedAt: new Date(),
            }
          : entry
      ));
      return data;
    },
    onSuccess: () => {
      setIsRunning(false);
      setCurrentTime(0);
      toast({ title: "Timer stopped ✓" });
    },
  });

  const addManualEntryMutation = useMutation({
    mutationFn: async (data: any) => {
      // Add manual entry to localStorage
      const newEntry: TimeEntry = {
        id: Date.now(),
        userId: 'local-user',
        projectId: data.projectId,
        taskName: data.taskName || null,
        description: data.description || null,
        startTime: new Date(data.date),
        endTime: new Date(data.date),
        duration: parseInt(data.duration) * 60 || 0, // Convert minutes to seconds
        isManual: true,
        isBillable: false,
        hourlyRate: 0,
        tags: [],
        metadata: null,
        idleTime: 0,
        isActive: false,
        predictedCategory: null,
        confidenceScore: null,
        anomalyFlags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setLocalTimeEntries(prev => [newEntry, ...prev]);
      return newEntry;
    },
    onSuccess: () => {
      setManualEntryForm({
        taskName: "",
        description: "",
        duration: "",
        date: format(new Date(), "yyyy-MM-dd"),
      });
      toast({ title: "Time entry added ✓" });
    },
  });

  // Core timer functions
  const switchTask = (newProjectId: number) => {
    if (isRunning) {
      stopTimerMutation.mutate({ projectId: activeProject });
    }
    setActiveProject(newProjectId);
    startTimerMutation.mutate({ projectId: newProjectId });
  };

  const detectIdleTime = () => {
    const now = Date.now();
    const timeSinceActivity = now - lastActivity;
    const IDLE_THRESHOLD = 5 * 60 * 1000; // 5 minutes

    if (timeSinceActivity > IDLE_THRESHOLD && isRunning) {
      setIdleDuration(Math.floor(timeSinceActivity / 1000));
      setShowIdlePrompt(true);
      setIsRunning(false);
    }
  };

  const handleIdlePrompt = (action: "keep" | "discard" | "categorize", category?: string) => {
    // Implementation for handling idle time
    setShowIdlePrompt(false);
    toast({ title: `Idle time ${action}ed` });
  };

  const getRecentTasks = () => {
    return (recentTasks as any[]).slice(0, 5);
  };

  const predictDuration = (taskType: string, historicalData: any[]) => {
    const similarTasks = historicalData.filter(task => 
      task.taskName?.toLowerCase().includes(taskType.toLowerCase())
    );
    
    if (similarTasks.length === 0) return 3600; // Default 1 hour
    
    const avgDuration = similarTasks.reduce((sum, task) => sum + task.duration, 0) / similarTasks.length;
    return Math.round(avgDuration);
  };

  const detectAnomaly = (timeEntry: any, historicalAverage: number) => {
    const duration = timeEntry.duration;
    const threshold = historicalAverage * 2; // 200% of average
    
    if (duration > threshold) {
      return { type: "long_duration", message: "Unusually long session" };
    }
    
    if (duration < historicalAverage * 0.1) {
      return { type: "short_duration", message: "Very short session" };
    }
    
    return null;
  };

  // Activity detection
  useEffect(() => {
    const handleActivity = () => {
      setLastActivity(Date.now());
    };

    document.addEventListener("mousemove", handleActivity);
    document.addEventListener("keypress", handleActivity);
    document.addEventListener("click", handleActivity);

    return () => {
      document.removeEventListener("mousemove", handleActivity);
      document.removeEventListener("keypress", handleActivity);
      document.removeEventListener("click", handleActivity);
    };
  }, []);

  // Timer and idle detection
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setCurrentTime(prev => prev + 1);
      }, 1000);

      idleCheckRef.current = setInterval(detectIdleTime, 30000); // Check every 30 seconds
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (idleCheckRef.current) clearInterval(idleCheckRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (idleCheckRef.current) clearInterval(idleCheckRef.current);
    };
  }, [isRunning, lastActivity]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "k":
            e.preventDefault();
            setShowQuickSwitcher(true);
            break;
          case " ":
            e.preventDefault();
            if (activeProject) {
              if (isRunning) {
                stopTimerMutation.mutate({ projectId: activeProject });
              } else {
                startTimerMutation.mutate({ projectId: activeProject });
              }
            }
            break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [activeProject, isRunning]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const activeProjectData = (projects as any[]).find((p: any) => p.id === activeProject);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Project Timer</h2>
          <p className="text-slate-600 dark:text-slate-400">Advanced time tracking with AI insights</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowQuickSwitcher(true)}
          >
            <Zap className="h-4 w-4 mr-2" />
            Quick Switch (Ctrl+K)
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="timer">
            <Timer className="h-4 w-4 mr-2" />
            Timer
          </TabsTrigger>
          <TabsTrigger value="projects">
            <Target className="h-4 w-4 mr-2" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="reports">
            <BarChart3 className="h-4 w-4 mr-2" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="insights">
            <TrendingUp className="h-4 w-4 mr-2" />
            AI Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timer" className="space-y-6">
          {/* Active Timer Display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Active Timer</span>
                {isRunning && (
                  <Badge variant="default" className="animate-pulse">
                    <Activity className="h-3 w-3 mr-1" />
                    Recording
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="text-6xl font-mono font-bold">
                  {formatTime(currentTime)}
                </div>
                
                {activeProjectData && (
                  <div className="flex items-center justify-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: activeProjectData.color }}
                    />
                    <span className="text-lg">{activeProjectData.name}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-center gap-2">
                  {!isRunning ? (
                    <Button
                      onClick={() => activeProject && startTimerMutation.mutate({ projectId: activeProject })}
                      disabled={!activeProject || startTimerMutation.isPending}
                      size="lg"
                    >
                      <Play className="h-5 w-5 mr-2" />
                      Start Timer
                    </Button>
                  ) : (
                    <Button
                      onClick={() => stopTimerMutation.mutate({ projectId: activeProject })}
                      disabled={stopTimerMutation.isPending}
                      variant="destructive"
                      size="lg"
                    >
                      <Square className="h-5 w-5 mr-2" />
                      Stop Timer
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Selection & Manual Entry */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Project</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(projects as any[]).map((project: any) => (
                  <Button
                    key={project.id}
                    variant={activeProject === project.id ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setActiveProject(project.id)}
                  >
                    <div 
                      className="w-3 h-3 rounded-full mr-3"
                      style={{ backgroundColor: project.color || '#3b82f6' }}
                    />
                    {project.name}
                    {project.isBillable && (
                      <DollarSign className="h-3 w-3 ml-auto" />
                    )}
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Manual Time Entry</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Task Name</Label>
                  <Input
                    value={manualEntryForm.taskName}
                    onChange={(e) => setManualEntryForm({ ...manualEntryForm, taskName: e.target.value })}
                    placeholder="What did you work on?"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Duration (hours)</Label>
                  <Input
                    type="number"
                    step="0.25"
                    value={manualEntryForm.duration}
                    onChange={(e) => setManualEntryForm({ ...manualEntryForm, duration: e.target.value })}
                    placeholder="2.5"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={manualEntryForm.date}
                    onChange={(e) => setManualEntryForm({ ...manualEntryForm, date: e.target.value })}
                  />
                </div>
                
                {(recentTasks as any[]).length > 0 && (
                  <SmartSuggestions 
                    recentTasks={getRecentTasks()} 
                    onSelect={(task) => setManualEntryForm({ 
                      ...manualEntryForm, 
                      taskName: task.name,
                      duration: task.estimatedDuration ? (task.estimatedDuration / 60).toString() : ""
                    })}
                  />
                )}
                
                <Button
                  onClick={() => addManualEntryMutation.mutate({
                    ...manualEntryForm,
                    projectId: activeProject,
                    duration: parseFloat(manualEntryForm.duration) * 3600
                  })}
                  disabled={!manualEntryForm.taskName || !manualEntryForm.duration || !activeProject}
                  className="w-full"
                >
                  Add Entry
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Your Projects</h3>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Project Name</Label>
                    <Input
                      value={newProjectForm.name}
                      onChange={(e) => setNewProjectForm({ ...newProjectForm, name: e.target.value })}
                      placeholder="My Awesome Project"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={newProjectForm.description}
                      onChange={(e) => setNewProjectForm({ ...newProjectForm, description: e.target.value })}
                      placeholder="Project description..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Color</Label>
                      <Input
                        type="color"
                        value={newProjectForm.color}
                        onChange={(e) => setNewProjectForm({ ...newProjectForm, color: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Client</Label>
                      <Input
                        value={newProjectForm.clientName}
                        onChange={(e) => setNewProjectForm({ ...newProjectForm, clientName: e.target.value })}
                        placeholder="Client name"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newProjectForm.isBillable}
                      onCheckedChange={(checked) => setNewProjectForm({ ...newProjectForm, isBillable: checked })}
                    />
                    <Label>Billable Project</Label>
                  </div>
                  
                  {newProjectForm.isBillable && (
                    <div className="space-y-2">
                      <Label>Hourly Rate ($)</Label>
                      <Input
                        type="number"
                        value={newProjectForm.billableRate / 100}
                        onChange={(e) => setNewProjectForm({ 
                          ...newProjectForm, 
                          billableRate: parseFloat(e.target.value) * 100 
                        })}
                        placeholder="50.00"
                      />
                    </div>
                  )}
                  
                  <Button
                    onClick={() => createProjectMutation.mutate(newProjectForm)}
                    disabled={!newProjectForm.name || createProjectMutation.isPending}
                    className="w-full"
                  >
                    Create Project
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(projects as any[]).map((project: any) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: project.color || '#3b82f6' }}
                      />
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                    </div>
                    {project.isBillable && (
                      <Badge variant="secondary">
                        <DollarSign className="h-3 w-3" />
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {project.description || "No description"}
                  </p>
                  
                  <div className="space-y-2 text-sm">
                    {project.clientName && (
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        {project.clientName}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      Total: 0h 0m
                    </div>
                    
                    {project.isBillable && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-3 w-3" />
                        ${(project.billableRate / 100).toFixed(2)}/hour
                      </div>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4"
                    onClick={() => setActiveProject(project.id)}
                  >
                    Select Project
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="text-center py-8 text-gray-500">
            Dynamic reporting dashboard will be implemented here.
            Features will include:
            <ul className="mt-4 space-y-2 text-left max-w-md mx-auto">
              <li>• Interactive charts with Chart.js</li>
              <li>• Customizable date ranges and filters</li>
              <li>• Export to PDF/CSV</li>
              <li>• Billable vs non-billable time breakdown</li>
              <li>• Project profitability analysis</li>
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="text-center py-8 text-gray-500">
            AI-powered insights panel will show:
            <ul className="mt-4 space-y-2 text-left max-w-md mx-auto">
              <li>• Productivity patterns and trends</li>
              <li>• Anomaly detection in time logs</li>
              <li>• Task duration predictions</li>
              <li>• Optimal work schedules</li>
              <li>• Automated categorization suggestions</li>
            </ul>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Switcher Modal */}
      <QuickSwitcher
        projects={projects as any[]}
        onSwitch={switchTask}
        isOpen={showQuickSwitcher}
        onClose={() => setShowQuickSwitcher(false)}
      />

      {/* Idle Time Prompt */}
      <IdlePrompt
        isOpen={showIdlePrompt}
        idleDuration={idleDuration}
        onKeep={() => handleIdlePrompt("keep")}
        onDiscard={() => handleIdlePrompt("discard")}
        onCategorize={(category) => handleIdlePrompt("categorize", category)}
      />
    </div>
  );
}