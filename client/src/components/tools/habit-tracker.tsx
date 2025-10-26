import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Target, 
  Calendar, 
  TrendingUp, 
  CheckCircle, 
  Flame, 
  Award,
  BarChart3,
  Crown,
  Zap,
  Clock,
  Tag,
  Filter,
  Download,
  Upload,
  Star,
  Brain,
  Trophy,
  Activity,
  Sun,
  Moon,
  Coffee,
  Heart,
  DollarSign,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Info,
  X,
  Check,
  AlertCircle,
  TrendingDown
} from "lucide-react";
import { 
  format, 
  startOfWeek, 
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays, 
  subDays,
  addMonths,
  subMonths, 
  isSameDay,
  differenceInDays,
  eachDayOfInterval,
  getDay,
  isToday,
  startOfYear,
  endOfYear
} from "date-fns";
import type { Habit, HabitLog } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const habitSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  description: z.string().optional(),
  frequency: z.enum(["daily", "weekly", "monthly"]).default("daily"),
  targetDays: z.array(z.number()).default([1, 2, 3, 4, 5, 6, 7]),
  color: z.string().default("#2563EB"),
  category: z.string().default("general"),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  reminderTime: z.string().optional(),
  goal: z.number().optional(),
  icon: z.string().default("target"),
});

type HabitFormData = z.infer<typeof habitSchema>;

const colors = [
  { color: "#2563EB", name: "Blue" },
  { color: "#059669", name: "Emerald" },
  { color: "#DC2626", name: "Red" },
  { color: "#7C3AED", name: "Purple" },
  { color: "#EA580C", name: "Orange" },
  { color: "#0891B2", name: "Cyan" },
  { color: "#CA8A04", name: "Yellow" },
  { color: "#BE185D", name: "Pink" },
  { color: "#10B981", name: "Green" },
  { color: "#6B7280", name: "Gray" },
  { color: "#F59E0B", name: "Amber" },
  { color: "#8B5CF6", name: "Violet" },
];

const categories = [
  { value: "general", label: "General", icon: Target },
  { value: "health", label: "Health & Fitness", icon: Heart },
  { value: "productivity", label: "Productivity", icon: Zap },
  { value: "learning", label: "Learning", icon: Brain },
  { value: "mindfulness", label: "Mindfulness", icon: Sparkles },
  { value: "finance", label: "Finance", icon: DollarSign },
  { value: "social", label: "Social", icon: Coffee },
  { value: "creative", label: "Creative", icon: Star },
];

const habitIcons = [
  { value: "target", icon: Target, label: "Target" },
  { value: "flame", icon: Flame, label: "Flame" },
  { value: "heart", icon: Heart, label: "Heart" },
  { value: "brain", icon: Brain, label: "Brain" },
  { value: "zap", icon: Zap, label: "Zap" },
  { value: "star", icon: Star, label: "Star" },
  { value: "coffee", icon: Coffee, label: "Coffee" },
  { value: "sun", icon: Sun, label: "Sun" },
  { value: "moon", icon: Moon, label: "Moon" },
  { value: "trophy", icon: Trophy, label: "Trophy" },
];

const habitTemplates = [
  { 
    title: "Morning Workout", 
    category: "health", 
    difficulty: "medium" as const,
    description: "30 minutes of exercise",
    targetDays: [1, 2, 3, 4, 5],
    color: "#DC2626",
    icon: "heart"
  },
  { 
    title: "Read for 30 minutes", 
    category: "learning", 
    difficulty: "easy" as const,
    description: "Daily reading habit",
    targetDays: [1, 2, 3, 4, 5, 6, 7],
    color: "#7C3AED",
    icon: "brain"
  },
  { 
    title: "Meditate", 
    category: "mindfulness", 
    difficulty: "easy" as const,
    description: "10 minutes of meditation",
    targetDays: [1, 2, 3, 4, 5, 6, 7],
    color: "#8B5CF6",
    icon: "sparkles"
  },
  { 
    title: "Drink 8 glasses of water", 
    category: "health", 
    difficulty: "medium" as const,
    description: "Stay hydrated throughout the day",
    targetDays: [1, 2, 3, 4, 5, 6, 7],
    color: "#0891B2",
    icon: "sun"
  },
  { 
    title: "Learn something new", 
    category: "learning", 
    difficulty: "medium" as const,
    description: "Spend time on skill development",
    targetDays: [1, 2, 3, 4, 5],
    color: "#EA580C",
    icon: "zap"
  },
  { 
    title: "Journal", 
    category: "mindfulness", 
    difficulty: "easy" as const,
    description: "Write in your journal",
    targetDays: [1, 2, 3, 4, 5, 6, 7],
    color: "#CA8A04",
    icon: "star"
  },
];

const weekDays = [
  { value: 1, label: "Mon", short: "M" },
  { value: 2, label: "Tue", short: "T" },
  { value: 3, label: "Wed", short: "W" },
  { value: 4, label: "Thu", short: "T" },
  { value: 5, label: "Fri", short: "F" },
  { value: 6, label: "Sat", short: "S" },
  { value: 7, label: "Sun", short: "S" },
];

type ViewMode = "overview" | "calendar" | "analytics" | "achievements";

export default function HabitTrackerTool() {
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteHabit, setNoteHabit] = useState<{ habit: Habit; date: Date } | null>(null);
  const [noteText, setNoteText] = useState("");
  const { toast } = useToast();

  const form = useForm<HabitFormData>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      title: "",
      description: "",
      frequency: "daily",
      targetDays: [1, 2, 3, 4, 5, 6, 7],
      color: "#2563EB",
      category: "general",
      difficulty: "medium",
      icon: "target",
    },
  });

  const { data: habits = [], isLoading: habitsLoading } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });

  const { data: habitLogs = [], isLoading: logsLoading } = useQuery<HabitLog[]>({
    queryKey: ["/api/habit-logs"],
  });

  const createHabitMutation = useMutation({
    mutationFn: (data: HabitFormData) => apiRequest("POST", "/api/habits", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      setIsDialogOpen(false);
      form.reset();
      setEditingHabit(null);
      toast({ title: "Habit created successfully!" });
    },
  });

  const updateHabitMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<Habit>) =>
      apiRequest("PATCH", `/api/habits/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      setIsDialogOpen(false);
      form.reset();
      setEditingHabit(null);
      toast({ title: "Habit updated successfully!" });
    },
  });

  const deleteHabitMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/habits/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      setSelectedHabit(null);
      toast({ title: "Habit deleted" });
    },
  });

  const createLogMutation = useMutation({
    mutationFn: (data: { habitId: number; date: string; completed: boolean; note?: string }) =>
      apiRequest("POST", "/api/habit-logs", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
    },
  });

  const deleteLogMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/habit-logs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
    },
  });

  const onSubmit = (data: HabitFormData) => {
    if (editingHabit) {
      updateHabitMutation.mutate({ id: editingHabit.id, ...data });
    } else {
      createHabitMutation.mutate(data);
    }
  };

  const openHabitDialog = (habit?: Habit) => {
    if (habit) {
      setEditingHabit(habit);
      form.setValue("title", habit.title);
      form.setValue("description", habit.description || "");
      form.setValue("frequency", habit.frequency as "daily" | "weekly" | "monthly");
      form.setValue("targetDays", habit.targetDays as number[] || [1, 2, 3, 4, 5, 6, 7]);
      form.setValue("color", habit.color || "#2563EB");
      form.setValue("category", (habit as any).category || "general");
      form.setValue("difficulty", (habit as any).difficulty || "medium");
      form.setValue("icon", (habit as any).icon || "target");
    } else {
      setEditingHabit(null);
      form.reset();
    }
    setIsDialogOpen(true);
  };

  const applyTemplate = (template: typeof habitTemplates[0]) => {
    form.setValue("title", template.title);
    form.setValue("description", template.description);
    form.setValue("category", template.category);
    form.setValue("difficulty", template.difficulty);
    form.setValue("targetDays", template.targetDays);
    form.setValue("color", template.color);
    form.setValue("icon", template.icon);
    setIsTemplateDialogOpen(false);
    setIsDialogOpen(true);
  };

  const toggleHabitCompletion = (habit: Habit, date: Date, withNote: boolean = false) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const existingLog = habitLogs.find(log => 
      log.habitId === habit.id && 
      format(new Date(log.date), "yyyy-MM-dd") === dateStr
    );

    if (existingLog) {
      deleteLogMutation.mutate(existingLog.id);
    } else if (withNote) {
      setNoteHabit({ habit, date });
      setNoteDialogOpen(true);
    } else {
      createLogMutation.mutate({
        habitId: habit.id,
        date: date.toISOString(),
        completed: true,
      });
    }
  };

  const saveNoteAndComplete = () => {
    if (noteHabit) {
      createLogMutation.mutate({
        habitId: noteHabit.habit.id,
        date: noteHabit.date.toISOString(),
        completed: true,
        note: noteText,
      });
      setNoteDialogOpen(false);
      setNoteText("");
      setNoteHabit(null);
      toast({ title: "Habit completed with note!" });
    }
  };

  const getHabitCompletion = (habit: Habit, date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return habitLogs.some(log => 
      log.habitId === habit.id && 
      format(new Date(log.date), "yyyy-MM-dd") === dateStr
    );
  };

  const calculateStreak = (habit: Habit) => {
    const habitLogsForHabit = habitLogs.filter(log => log.habitId === habit.id);
    if (habitLogsForHabit.length === 0) return 0;

    const sortedLogs = habitLogsForHabit
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
      const checkDate = subDays(currentDate, i);
      const hasLog = sortedLogs.some(log => 
        isSameDay(new Date(log.date), checkDate)
      );

      if (hasLog) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return streak;
  };

  const calculateBestStreak = (habit: Habit) => {
    const habitLogsForHabit = habitLogs.filter(log => log.habitId === habit.id);
    if (habitLogsForHabit.length === 0) return 0;

    const sortedDates = habitLogsForHabit
      .map(log => new Date(log.date))
      .sort((a, b) => a.getTime() - b.getTime());

    let maxStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const daysDiff = differenceInDays(sortedDates[i], sortedDates[i - 1]);
      if (daysDiff === 1) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }

    return maxStreak;
  };

  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(currentWeekStart, i));
    }
    return days;
  };

  const getCompletionRate = (habit: Habit, days: number = 30) => {
    const startDate = subDays(new Date(), days);
    const relevantLogs = habitLogs.filter(log => 
      log.habitId === habit.id && 
      new Date(log.date) >= startDate
    );
    
    const rate = Math.round((relevantLogs.length / days) * 100);
    return Math.min(rate, 100);
  };

  const getTotalCompletions = (habit: Habit) => {
    return habitLogs.filter(log => log.habitId === habit.id).length;
  };

  const filteredHabits = useMemo(() => {
    if (filterCategory === "all") return habits;
    return habits.filter(h => (h as any).category === filterCategory);
  }, [habits, filterCategory]);

  // Analytics calculations
  const totalHabits = habits.length;
  const activeHabits = habits.filter(h => calculateStreak(h) > 0).length;
  const totalCompletions = habitLogs.length;
  const averageCompletionRate = habits.length > 0
    ? Math.round(habits.reduce((sum, h) => sum + getCompletionRate(h, 30), 0) / habits.length)
    : 0;

  const getBestPerformingHabit = () => {
    if (habits.length === 0) return null;
    return habits.reduce((best, current) => {
      const currentRate = getCompletionRate(current, 30);
      const bestRate = getCompletionRate(best, 30);
      return currentRate > bestRate ? current : best;
    });
  };

  const getTotalPoints = () => {
    let points = 0;
    habits.forEach(habit => {
      const difficulty = (habit as any).difficulty || "medium";
      const multiplier = difficulty === "hard" ? 3 : difficulty === "medium" ? 2 : 1;
      const completions = getTotalCompletions(habit);
      points += completions * multiplier;
    });
    return points;
  };

  const getAchievements = () => {
    const achievements = [];
    
    // First habit
    if (habits.length >= 1) {
      achievements.push({ title: "First Step", description: "Created your first habit", icon: Star, unlocked: true });
    }
    
    // 5 habits
    if (habits.length >= 5) {
      achievements.push({ title: "Habit Builder", description: "Created 5 habits", icon: Trophy, unlocked: true });
    }
    
    // 7 day streak
    const has7DayStreak = habits.some(h => calculateStreak(h) >= 7);
    if (has7DayStreak) {
      achievements.push({ title: "Week Warrior", description: "7-day streak on any habit", icon: Flame, unlocked: true });
    }
    
    // 30 day streak
    const has30DayStreak = habits.some(h => calculateStreak(h) >= 30);
    if (has30DayStreak) {
      achievements.push({ title: "Monthly Master", description: "30-day streak on any habit", icon: Crown, unlocked: true });
    }
    
    // 100 completions
    if (totalCompletions >= 100) {
      achievements.push({ title: "Century Club", description: "100 total habit completions", icon: Award, unlocked: true });
    }
    
    // Perfect week
    const lastWeekStart = subDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 7);
    const lastWeekEnd = endOfWeek(lastWeekStart, { weekStartsOn: 1 });
    const lastWeekDays = eachDayOfInterval({ start: lastWeekStart, end: lastWeekEnd });
    const perfectWeek = habits.length > 0 && habits.every(habit => {
      return lastWeekDays.every(day => getHabitCompletion(habit, day));
    });
    if (perfectWeek) {
      achievements.push({ title: "Perfect Week", description: "Completed all habits for a full week", icon: Sparkles, unlocked: true });
    }
    
    return achievements;
  };

  const exportData = () => {
    const data = {
      habits,
      logs: habitLogs,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `habits-export-${format(new Date(), "yyyy-MM-dd")}.json`;
    a.click();
    toast({ title: "Data exported successfully!" });
  };

  const getMonthDays = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  };

  const getHeatmapIntensity = (habit: Habit, date: Date) => {
    const completed = getHabitCompletion(habit, date);
    return completed ? "high" : "none";
  };

  if (habitsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Advanced Habit Tracker</h2>
          <p className="text-slate-600 mt-1">
            {totalHabits} habits • {activeHabits} active • {totalCompletions} total completions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsTemplateDialogOpen(true)}>
            <Sparkles className="w-4 h-4 mr-2" />
            Templates
          </Button>
          <Button onClick={() => openHabitDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            New Habit
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Points</p>
                <p className="text-2xl font-bold text-slate-900">{getTotalPoints()}</p>
              </div>
              <Trophy className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Active Habits</p>
                <p className="text-2xl font-bold text-slate-900">{activeHabits}/{totalHabits}</p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Avg. Completion</p>
                <p className="text-2xl font-bold text-slate-900">{averageCompletionRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Achievements</p>
                <p className="text-2xl font-bold text-slate-900">{getAchievements().length}</p>
              </div>
              <Award className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <Target className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <Calendar className="w-4 h-4 mr-2" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="achievements">
            <Award className="w-4 h-4 mr-2" />
            Achievements
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-600" />
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredHabits.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <div className="text-slate-500 mb-4">
                  {filterCategory === "all" 
                    ? "No habits yet. Create your first habit to start building positive routines!"
                    : "No habits in this category."}
                </div>
                <Button onClick={() => openHabitDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Habit
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Habits Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredHabits.map((habit) => {
                  const streak = calculateStreak(habit);
                  const bestStreak = calculateBestStreak(habit);
                  const completionRate = getCompletionRate(habit, 30);
                  const todayCompleted = getHabitCompletion(habit, new Date());
                  const totalComps = getTotalCompletions(habit);
                  const HabitIcon = habitIcons.find(h => h.value === (habit as any).icon)?.icon || Target;
                  const difficulty = (habit as any).difficulty || "medium";
                  
                  return (
                    <Card 
                      key={habit.id} 
                      className="hover:shadow-lg transition-all relative overflow-hidden"
                    >
                      {/* Difficulty Indicator */}
                      <div 
                        className="absolute top-0 right-0 w-16 h-16 opacity-10"
                        style={{ 
                          background: `linear-gradient(135deg, transparent 50%, ${habit.color || '#2563EB'} 50%)` 
                        }}
                      />
                      
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" 
                              style={{ backgroundColor: `${habit.color}20` }}
                            >
                              <HabitIcon className="w-5 h-5" style={{ color: habit.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg leading-tight">{habit.title}</CardTitle>
                              {habit.description && (
                                <p className="text-sm text-slate-600 line-clamp-1 mt-1">
                                  {habit.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 ml-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openHabitDialog(habit)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteHabitMutation.mutate(habit.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {/* Today's Status */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-700">Today</span>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={todayCompleted ? "default" : "outline"}
                              onClick={() => toggleHabitCompletion(habit, new Date())}
                              className="h-8"
                            >
                              {todayCompleted ? (
                                <><CheckCircle className="w-3.5 h-3.5 mr-1" /> Done</>
                              ) : (
                                <><Check className="w-3.5 h-3.5 mr-1" /> Mark</>
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Flame className="w-3.5 h-3.5 text-orange-500" />
                              <span className="text-lg font-bold text-slate-900">{streak}</span>
                            </div>
                            <p className="text-xs text-slate-600">Current</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Trophy className="w-3.5 h-3.5 text-amber-500" />
                              <span className="text-lg font-bold text-slate-900">{bestStreak}</span>
                            </div>
                            <p className="text-xs text-slate-600">Best</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                              <span className="text-lg font-bold text-slate-900">{totalComps}</span>
                            </div>
                            <p className="text-xs text-slate-600">Total</p>
                          </div>
                        </div>

                        {/* Progress */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-600">30-Day Rate</span>
                            <span className="font-semibold text-slate-900">{completionRate}%</span>
                          </div>
                          <Progress value={completionRate} className="h-2" />
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-1.5">
                          <Badge variant="outline" className="text-xs capitalize">
                            <Tag className="w-3 h-3 mr-1" />
                            {(habit as any).category || "general"}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={`text-xs capitalize ${
                              difficulty === "hard" ? "border-red-300 text-red-700" :
                              difficulty === "medium" ? "border-amber-300 text-amber-700" :
                              "border-green-300 text-green-700"
                            }`}
                          >
                            {difficulty}
                          </Badge>
                          {streak >= 21 && (
                            <Badge className="text-xs bg-gradient-to-r from-purple-500 to-pink-500">
                              <Sparkles className="w-3 h-3 mr-1" />
                              On Fire!
                            </Badge>
                          )}
                        </div>

                        {/* Mini Week View */}
                        <div className="flex justify-between pt-2 border-t">
                          {getWeekDays().map((day, idx) => {
                            const completed = getHabitCompletion(habit, day);
                            const today = isToday(day);
                            return (
                              <button
                                key={idx}
                                onClick={() => toggleHabitCompletion(habit, day)}
                                className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium transition-all ${
                                  completed 
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                    : today
                                      ? 'border-2 border-primary text-primary hover:bg-primary/10'
                                      : 'text-slate-400 hover:bg-slate-100'
                                }`}
                              >
                                {completed ? <Check className="w-4 h-4" /> : weekDays[idx].short}
                              </button>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Monthly Calendar</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-[120px] text-center">
                    {format(currentMonth, "MMMM yyyy")}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentMonth(new Date())}
                  >
                    Today
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                {habits.map(habit => {
                  const HabitIcon = habitIcons.find(h => h.value === (habit as any).icon)?.icon || Target;
                  return (
                    <div key={habit.id} className="mb-8">
                      <div className="flex items-center gap-2 mb-3">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center" 
                          style={{ backgroundColor: `${habit.color}20` }}
                        >
                          <HabitIcon className="w-4 h-4" style={{ color: habit.color }} />
                        </div>
                        <h3 className="font-semibold text-slate-900">{habit.title}</h3>
                        <Badge variant="outline" className="ml-auto">
                          {habitLogs.filter(l => 
                            l.habitId === habit.id && 
                            format(new Date(l.date), "yyyy-MM") === format(currentMonth, "yyyy-MM")
                          ).length} / {getMonthDays().length}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {/* Day headers */}
                        {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
                          <div key={idx} className="text-center text-xs font-medium text-slate-500 pb-1">
                            {day}
                          </div>
                        ))}
                        
                        {/* Empty cells for alignment */}
                        {Array.from({ length: (getDay(startOfMonth(currentMonth)) + 6) % 7 }).map((_, idx) => (
                          <div key={`empty-${idx}`} />
                        ))}
                        
                        {/* Calendar days */}
                        {getMonthDays().map((day, idx) => {
                          const completed = getHabitCompletion(habit, day);
                          const today = isToday(day);
                          return (
                            <button
                              key={idx}
                              onClick={() => toggleHabitCompletion(habit, day)}
                              className={`aspect-square rounded-md flex items-center justify-center text-xs relative transition-all ${
                                completed 
                                  ? 'text-white font-semibold' 
                                  : today
                                    ? 'border-2 border-primary text-primary font-medium hover:bg-primary/10'
                                    : 'text-slate-600 hover:bg-slate-100'
                              }`}
                              style={{
                                backgroundColor: completed ? habit.color : undefined,
                              }}
                            >
                              {format(day, "d")}
                              {today && !completed && (
                                <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Best Performing Habit</CardTitle>
              </CardHeader>
              <CardContent>
                {getBestPerformingHabit() ? (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center" 
                        style={{ backgroundColor: `${getBestPerformingHabit()?.color}20` }}
                      >
                        <Trophy className="w-6 h-6" style={{ color: getBestPerformingHabit()?.color }} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{getBestPerformingHabit()?.title}</h3>
                        <p className="text-sm text-slate-600">
                          {getCompletionRate(getBestPerformingHabit()!, 30)}% completion rate
                        </p>
                      </div>
                    </div>
                    <Progress value={getCompletionRate(getBestPerformingHabit()!, 30)} className="h-3" />
                  </div>
                ) : (
                  <p className="text-slate-500">No data yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Habit Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categories.map(cat => {
                    const count = habits.filter(h => (h as any).category === cat.value).length;
                    const percentage = habits.length > 0 ? (count / habits.length) * 100 : 0;
                    const Icon = cat.icon;
                    return (
                      <div key={cat.value}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-slate-600" />
                            <span className="text-sm font-medium">{cat.label}</span>
                          </div>
                          <span className="text-sm text-slate-600">{count}</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>All Habits Performance</CardTitle>
                <CardDescription>30-day completion rates and streaks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {habits.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">No habits to analyze yet</p>
                  ) : (
                    habits.map(habit => {
                      const rate = getCompletionRate(habit, 30);
                      const streak = calculateStreak(habit);
                      const HabitIcon = habitIcons.find(h => h.value === (habit as any).icon)?.icon || Target;
                      
                      return (
                        <div key={habit.id} className="flex items-center gap-4">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" 
                            style={{ backgroundColor: `${habit.color}20` }}
                          >
                            <HabitIcon className="w-5 h-5" style={{ color: habit.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-slate-900">{habit.title}</span>
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                                  <span className="font-semibold">{streak}</span>
                                </div>
                                <span className="font-semibold">{rate}%</span>
                              </div>
                            </div>
                            <Progress value={rate} className="h-2" />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Insights & Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {habits.length === 0 && (
                    <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">Get Started</p>
                        <p className="text-sm text-blue-700">Create your first habit to start building positive routines!</p>
                      </div>
                    </div>
                  )}
                  
                  {averageCompletionRate < 50 && habits.length > 0 && (
                    <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-900">Needs Attention</p>
                        <p className="text-sm text-amber-700">
                          Your average completion rate is {averageCompletionRate}%. Try reducing the number of habits or focusing on easier ones first.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {habits.some(h => calculateStreak(h) >= 21) && (
                    <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                      <Sparkles className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-green-900">Great Progress!</p>
                        <p className="text-sm text-green-700">
                          You have a 21+ day streak! Research shows it takes 21 days to form a habit. Keep going!
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {activeHabits === 0 && habits.length > 0 && (
                    <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                      <TrendingDown className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-900">Time to Restart</p>
                        <p className="text-sm text-red-700">
                          All streaks have ended. Don't worry! Starting again is part of the journey. Begin today!
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {averageCompletionRate >= 80 && habits.length > 0 && (
                    <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                      <Crown className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-purple-900">Excellent Performance!</p>
                        <p className="text-sm text-purple-700">
                          {averageCompletionRate}% completion rate is outstanding! Consider adding more challenging habits.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-amber-500" />
                Your Achievements
              </CardTitle>
              <CardDescription>
                Unlock achievements by building consistent habits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getAchievements().map((achievement, idx) => {
                  const Icon = achievement.icon;
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border-2 ${
                        achievement.unlocked
                          ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'
                          : 'bg-slate-50 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          achievement.unlocked ? 'bg-amber-100' : 'bg-slate-200'
                        }`}>
                          <Icon className={`w-6 h-6 ${
                            achievement.unlocked ? 'text-amber-600' : 'text-slate-400'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900">{achievement.title}</h3>
                          <p className="text-sm text-slate-600 mt-1">{achievement.description}</p>
                          {achievement.unlocked && (
                            <Badge variant="secondary" className="mt-2">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Unlocked
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Locked Achievements */}
                {habits.length < 5 && (
                  <div className="p-4 rounded-lg border-2 bg-slate-50 border-slate-200 opacity-60">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-slate-200">
                        <Trophy className="w-6 h-6 text-slate-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">Habit Builder</h3>
                        <p className="text-sm text-slate-600 mt-1">Create 5 habits</p>
                        <Badge variant="outline" className="mt-2">
                          {habits.length}/5
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Export/Import */}
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Export or import your habit data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button onClick={exportData} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Habit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingHabit ? "Edit Habit" : "Create New Habit"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Habit Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Morning workout, Read for 30 min" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Add more details about this habit..." {...field} rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difficulty</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="easy">Easy (1x points)</SelectItem>
                          <SelectItem value="medium">Medium (2x points)</SelectItem>
                          <SelectItem value="hard">Hard (3x points)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Harder habits earn more points
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {habitIcons.map(icon => {
                            const Icon = icon.icon;
                            return (
                              <SelectItem key={icon.value} value={icon.value}>
                                <div className="flex items-center gap-2">
                                  <Icon className="w-4 h-4" />
                                  {icon.label}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <div className="grid grid-cols-6 gap-2">
                      {colors.map((c) => (
                        <button
                          key={c.color}
                          type="button"
                          className={`h-10 rounded-lg border-2 transition-all ${
                            field.value === c.color ? "border-slate-900 scale-110" : "border-slate-200 hover:scale-105"
                          }`}
                          style={{ backgroundColor: c.color }}
                          onClick={() => field.onChange(c.color)}
                          title={c.name}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Days</FormLabel>
                    <div className="flex gap-2">
                      {weekDays.map((day) => (
                        <div key={day.value} className="flex-1">
                          <button
                            type="button"
                            className={`w-full h-10 rounded-md text-sm font-medium transition-all ${
                              field.value.includes(day.value)
                                ? 'bg-primary text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                            onClick={() => {
                              if (field.value.includes(day.value)) {
                                field.onChange(field.value.filter(d => d !== day.value));
                              } else {
                                field.onChange([...field.value, day.value]);
                              }
                            }}
                          >
                            {day.label}
                          </button>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createHabitMutation.isPending || updateHabitMutation.isPending}
                >
                  {createHabitMutation.isPending || updateHabitMutation.isPending
                    ? "Saving..." 
                    : editingHabit ? "Update Habit" : "Create Habit"
                  }
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Template Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Habit Templates</DialogTitle>
            <CardDescription>Quick start with popular habit templates</CardDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto p-1">
            {habitTemplates.map((template, idx) => {
              const Icon = habitIcons.find(h => h.value === template.icon)?.icon || Target;
              return (
                <button
                  key={idx}
                  onClick={() => applyTemplate(template)}
                  className="p-4 rounded-lg border-2 border-slate-200 hover:border-primary hover:shadow-md transition-all text-left"
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" 
                      style={{ backgroundColor: `${template.color}20` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: template.color }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{template.title}</h3>
                      <p className="text-sm text-slate-600 mt-1">{template.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs capitalize">
                          {categories.find(c => c.value === template.category)?.label}
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">
                          {template.difficulty}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
            <CardDescription>Add a note to this habit completion (optional)</CardDescription>
          </DialogHeader>
          <Textarea
            placeholder="How did it go? Any observations?"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveNoteAndComplete}>
              Save & Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
