import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { 
  Plus, Trash2, Calendar, Filter, SortAsc, CheckSquare, Square, 
  Clock, Tag, AlertCircle, ChevronDown, ChevronRight, Mic, Grid3X3,
  List, BarChart3, Calendar as CalendarIcon, Eye, EyeOff, Target,
  ArrowUp, ArrowDown, Circle, GripVertical, Edit3, Save, X
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertTodoSchema, type Todo } from "@shared/schema";
import { parseNaturalLanguageTask, formatRecurringPattern } from "@/lib/nlp-parser";
import VoiceQuickAdd from "./voice-quick-add";

// Make userId optional since server adds it automatically
type TodoFormData = Omit<z.infer<typeof insertTodoSchema>, 'userId'> & { userId?: string };

const priorityColors = {
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const eisenhowerQuadrants = {
  'high-high': { name: 'Do First', color: 'bg-red-500', description: 'Urgent & Important' },
  'high-medium': { name: 'Schedule', color: 'bg-orange-500', description: 'Important, Not Urgent' },
  'medium-high': { name: 'Delegate', color: 'bg-yellow-500', description: 'Urgent, Not Important' },
  'medium-medium': { name: 'Eliminate', color: 'bg-gray-500', description: 'Not Urgent, Not Important' },
};

interface SortableTaskProps {
  task: Todo;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (task: Todo) => void;
  onAddSubtask: (parentId: number) => void;
  showSubtasks: boolean;
  subtasks: Todo[];
}

function SortableTask({ task, onToggle, onDelete, onEdit, onAddSubtask, showSubtasks, subtasks }: SortableTaskProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const [showDetails, setShowDetails] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getQuadrant = (importance: string, urgency: string) => {
    return eisenhowerQuadrants[`${importance}-${urgency}` as keyof typeof eisenhowerQuadrants];
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;

  return (
    <div ref={setNodeRef} style={style} className="group">
      <Card className={`mb-2 ${task.completed ? 'opacity-60' : ''} ${isOverdue ? 'border-red-500' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            {/* Drag Handle */}
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mt-1">
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>

            {/* Task Checkbox */}
            <Checkbox
              checked={task.completed || false}
              onCheckedChange={() => onToggle(task.id)}
              className="mt-1"
            />

            {/* Task Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{task.description}</p>
                  )}
                  
                  {/* Tags and Labels */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {task.priority !== 'medium' && (
                      <Badge className={priorityColors[task.priority as keyof typeof priorityColors]}>
                        {task.priority}
                      </Badge>
                    )}
                    
                    {task.importance !== 'medium' && task.urgency !== 'medium' && (
                      <Badge 
                        className={`text-white ${getQuadrant(task.importance!, task.urgency!).color}`}
                      >
                        {getQuadrant(task.importance!, task.urgency!).name}
                      </Badge>
                    )}
                    
                    {task.category && (
                      <Badge variant="outline">{task.category}</Badge>
                    )}
                    
                    {task.tags?.map((tag) => (
                      <Badge key={tag} variant="secondary">#{tag}</Badge>
                    ))}
                    
                    {task.labels?.map((label) => (
                      <Badge key={label} variant="outline">@{label}</Badge>
                    ))}
                    
                    {task.isRecurring && (
                      <Badge variant="outline">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatRecurringPattern(task.recurringPattern)}
                      </Badge>
                    )}
                  </div>

                  {/* Due Date and Duration */}
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    {task.dueDate && (
                      <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : ''}`}>
                        <Calendar className="h-3 w-3" />
                        {format(new Date(task.dueDate), 'MMM d, yyyy')}
                        {isOverdue && <AlertCircle className="h-3 w-3" />}
                      </div>
                    )}
                    
                    {task.estimatedDuration && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {task.estimatedDuration}m
                      </div>
                    )}
                  </div>

                  {/* Subtasks */}
                  {showSubtasks && subtasks.length > 0 && (
                    <div className="mt-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Subtasks ({subtasks.filter(s => s.completed).length}/{subtasks.length})
                      </div>
                      {subtasks.map((subtask) => (
                        <div key={subtask.id} className="flex items-center gap-2 mb-1">
                          <Checkbox
                            checked={subtask.completed || false}
                            onCheckedChange={() => onToggle(subtask.id)}
                            className="h-3 w-3"
                          />
                          <span className={`text-sm ${subtask.completed ? 'line-through text-gray-500' : ''}`}>
                            {subtask.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAddSubtask(task.id)}
                    title="Add Subtask"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDetails(!showDetails)}
                  >
                    {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(task)}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(task.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Detailed View */}
              {showDetails && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <strong>Priority:</strong> {task.priority}
                    </div>
                    <div>
                      <strong>Importance:</strong> {task.importance}
                    </div>
                    <div>
                      <strong>Urgency:</strong> {task.urgency}
                    </div>
                    {task.estimatedDuration && (
                      <div>
                        <strong>Duration:</strong> {task.estimatedDuration}m
                      </div>
                    )}
                    {task.reminderDate && (
                      <div>
                        <strong>Reminder:</strong> {format(new Date(task.reminderDate), 'MMM d, yyyy HH:mm')}
                      </div>
                    )}
                    {task.originalText && (
                      <div className="col-span-2">
                        <strong>Original:</strong> {task.originalText}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function EnhancedTodoTool() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Todo | null>(null);
  const [nlpInput, setNlpInput] = useState("");
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'matrix' | 'calendar'>('list');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'created' | 'title'>('created');
  const [showCompleted, setShowCompleted] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(true);
  
  // Local storage for todos (fallback when no database)
  const [localTodos, setLocalTodos] = useState<Todo[]>([]);
  
  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('enhanced-todos');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setLocalTodos(parsed.map((t: any) => ({
          ...t,
          dueDate: t.dueDate ? new Date(t.dueDate) : null,
          reminderDate: t.reminderDate ? new Date(t.reminderDate) : null,
          completedAt: t.completedAt ? new Date(t.completedAt) : null,
          startedAt: t.startedAt ? new Date(t.startedAt) : null,
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt),
        })));
      } catch (e) {
        console.error('Failed to load todos from localStorage');
      }
    }
  }, []);
  
  // Save to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('enhanced-todos', JSON.stringify(localTodos));
  }, [localTodos]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const form = useForm<TodoFormData>({
    resolver: zodResolver(insertTodoSchema),
    defaultValues: {
      title: "",
      description: "",
      completed: false,
      priority: "medium",
      urgency: "medium",
      importance: "medium",
      category: "",
      tags: [],
      labels: [],
      customFields: {},
      parentId: null,
      position: 0,
      isRecurring: false,
      recurringPattern: null,
      originalText: "",
    },
  });

  // Query for fetching todos from server (will fallback to localStorage)
  const { data: serverTodos = [], isLoading } = useQuery({
    queryKey: ["/api/todos"],
    queryFn: () => apiRequest("GET", "/api/todos").then(res => res.json()).catch(() => [])
  });
  
  // Use server todos if available, otherwise use localStorage
  const todos = serverTodos.length > 0 ? serverTodos : localTodos;

  const createTodoMutation = useMutation({
    mutationFn: async (data: TodoFormData) => {
      // Always use localStorage
      const newTodo: Todo = {
        id: Date.now(),
        userId: 'local-user',
        title: data.title,
        description: data.description || null,
        completed: false,
        priority: data.priority || 'medium',
        urgency: data.urgency || 'medium',
        importance: data.importance || 'medium',
        category: data.category || null,
        tags: data.tags || [],
        labels: data.labels || [],
        customFields: data.customFields || null,
        dueDate: data.dueDate || null,
        reminderDate: data.reminderDate || null,
        estimatedDuration: data.estimatedDuration || null,
        actualDuration: null,
        progress: 0,
        timeTracking: null,
        dependencies: data.dependencies || [],
        blockedBy: [],
        notes: null,
        attachments: null,
        templateId: null,
        parentId: data.parentId || null,
        position: data.position || 0,
        isRecurring: data.isRecurring || false,
        recurringPattern: data.recurringPattern || null,
        originalText: data.originalText || null,
        completedAt: null,
        startedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setLocalTodos(prev => [...prev, newTodo]);
      return newTodo;
    },
    onSuccess: () => {
      setIsDialogOpen(false);
      setNlpInput("");
      form.reset();
      toast({ title: "Task created successfully ✓" });
    },
  });

  const updateTodoMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Todo> & { id: number }) => {
      // Update in localStorage
      setLocalTodos(prev => prev.map(todo => 
        todo.id === id 
          ? { ...todo, ...data, updatedAt: new Date() }
          : todo
      ));
      return { id, ...data };
    },
    onSuccess: () => {
      setEditingTask(null);
      toast({ title: "Task updated successfully ✓" });
    },
  });

  const deleteTodoMutation = useMutation({
    mutationFn: async (id: number) => {
      // Delete from localStorage
      setLocalTodos(prev => prev.filter(todo => todo.id !== id));
      return id;
    },
    onSuccess: () => {
      toast({ title: "Task deleted successfully ✓" });
    },
  });

  const toggleTodoMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: number; completed: boolean }) => {
      // Update in localStorage
      setLocalTodos(prev => prev.map(todo =>
        todo.id === id
          ? { ...todo, completed, completedAt: completed ? new Date() : null, updatedAt: new Date() }
          : todo
      ));
      return { id, completed };
    },
  });

  const handleNlpSubmit = () => {
    if (!nlpInput.trim()) return;
    
    const parsed = parseNaturalLanguageTask(nlpInput);
    
    createTodoMutation.mutate({
      title: parsed.title,
      description: parsed.description,
      priority: parsed.priority,
      urgency: parsed.urgency,
      importance: parsed.importance,
      tags: parsed.tags,
      labels: parsed.labels,
      category: parsed.category,
      dueDate: parsed.dueDate,
      reminderDate: parsed.reminderDate,
      estimatedDuration: parsed.estimatedDuration,
      isRecurring: parsed.isRecurring,
      recurringPattern: parsed.recurringPattern,
      originalText: parsed.originalText,
      completed: false,
      customFields: {},
      parentId: null,
      position: (todos as any[]).length,
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = filteredTodos.findIndex((todo: any) => todo.id === active.id);
      const newIndex = filteredTodos.findIndex((todo: any) => todo.id === over.id);
      
      const newTodos = arrayMove(filteredTodos, oldIndex, newIndex);
      
      // Update positions
      newTodos.forEach((todo: any, index: number) => {
        updateTodoMutation.mutate({ id: todo.id, position: index });
      });
    }
  };

  const filteredTodos = useMemo(() => {
    let filtered = (todos as any[]).filter((todo: Todo) => {
      if (!showCompleted && todo.completed) return false;
      if (filterCategory !== 'all' && todo.category !== filterCategory) return false;
      if (filterPriority !== 'all' && todo.priority !== filterPriority) return false;
      return !todo.parentId; // Only show parent tasks, not subtasks
    });

    // Sort todos
    filtered.sort((a: Todo, b: Todo) => {
      switch (sortBy) {
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
    });

    return filtered;
  }, [todos, showCompleted, filterCategory, filterPriority, sortBy]);

  const getSubtasks = (parentId: number) => {
    return (todos as any[]).filter((todo: Todo) => todo.parentId === parentId);
  };

  const categories = Array.from(new Set((todos as any[]).map((todo: Todo) => todo.category).filter(Boolean)));

  const handleAddSubtask = (parentId: number) => {
    const parentTask = (todos as any[]).find((t: Todo) => t.id === parentId);
    if (parentTask) {
      const subtaskTitle = prompt("Enter subtask title:");
      if (subtaskTitle?.trim()) {
        createTodoMutation.mutate({
          title: subtaskTitle.trim(),
          description: "",
          priority: parentTask.priority,
          urgency: parentTask.urgency,
          importance: parentTask.importance,
          category: parentTask.category,
          tags: [],
          labels: [],
          customFields: {},
          parentId: parentId,
          position: 0,
          isRecurring: false,
          recurringPattern: null,
          originalText: "",
          completed: false,
        });
      }
    }
  };

  const onSubmit = (data: TodoFormData) => {
    if (editingTask) {
      updateTodoMutation.mutate({ ...data, id: editingTask.id });
    } else {
      createTodoMutation.mutate({ ...data, position: (todos as any[]).length });
    }
  };

  const renderEisenhowerMatrix = () => {
    const matrix = {
      'high-high': (todos as any[]).filter((t: Todo) => t.importance === 'high' && t.urgency === 'high' && !t.completed),
      'high-medium': (todos as any[]).filter((t: Todo) => t.importance === 'high' && t.urgency !== 'high' && !t.completed),
      'medium-high': (todos as any[]).filter((t: Todo) => t.importance !== 'high' && t.urgency === 'high' && !t.completed),
      'medium-medium': (todos as any[]).filter((t: Todo) => t.importance !== 'high' && t.urgency !== 'high' && !t.completed),
    };

    return (
      <div className="grid grid-cols-2 gap-4 h-96">
        {Object.entries(matrix).map(([key, tasks]) => {
          const quadrant = eisenhowerQuadrants[key as keyof typeof eisenhowerQuadrants];
          return (
            <Card key={key} className="p-4">
              <div className={`w-full h-8 ${quadrant.color} text-white rounded mb-4 flex items-center justify-center`}>
                <h3 className="font-semibold text-sm">{quadrant.name}</h3>
              </div>
              <p className="text-xs text-gray-600 mb-3">{quadrant.description}</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {tasks.map((task: Todo) => (
                  <div key={task.id} className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                    <div className="font-medium">{task.title}</div>
                    {task.dueDate && (
                      <div className="text-xs text-gray-500 mt-1">
                        Due: {format(new Date(task.dueDate), 'MMM d')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header with NLP Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Enhanced Todo Manager
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCompleted(!showCompleted)}
              >
                {showCompleted ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showCompleted ? 'Hide' : 'Show'} Completed
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Task</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Task title" />
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
                              <Textarea {...field} value={field.value || ''} placeholder="Task description" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="priority"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Priority</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="low">Low</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ''} placeholder="Category" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        {editingTask ? 'Update' : 'Create'} Task
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* NLP Input */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder='Try: "Call John tomorrow at 3 PM about project X #work @urgent" or "Buy groceries every week @home"'
                value={nlpInput}
                onChange={(e) => setNlpInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNlpSubmit()}
                className="flex-1"
              />
              <Button onClick={handleNlpSubmit} disabled={!nlpInput.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Smart parsing: Use #tags, @labels, dates (tomorrow, next week), priorities (urgent, low priority), durations (30 minutes), and recurring patterns (daily, weekly)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Voice Quick Add */}
      <VoiceQuickAdd />

      {/* View Modes and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* View Mode Tabs */}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
              <TabsList>
                <TabsTrigger value="list">
                  <List className="h-4 w-4 mr-2" />
                  List
                </TabsTrigger>
                <TabsTrigger value="matrix">
                  <Grid3X3 className="h-4 w-4 mr-2" />
                  Matrix
                </TabsTrigger>
                <TabsTrigger value="kanban">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Kanban
                </TabsTrigger>
                <TabsTrigger value="calendar">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Calendar
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat: any) => (
                    <SelectItem key={cat as string} value={cat as string}>{cat as string}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="dueDate">Due Date</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      {viewMode === 'matrix' ? (
        <Card>
          <CardHeader>
            <CardTitle>Eisenhower Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            {renderEisenhowerMatrix()}
          </CardContent>
        </Card>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filteredTodos.map((todo: any) => todo.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {filteredTodos.map((todo: Todo) => (
                <SortableTask
                  key={todo.id}
                  task={todo}
                  onToggle={(id) => toggleTodoMutation.mutate({ id, completed: !todo.completed })}
                  onDelete={(id) => deleteTodoMutation.mutate(id)}
                  onEdit={setEditingTask}
                  onAddSubtask={handleAddSubtask}
                  showSubtasks={showSubtasks}
                  subtasks={getSubtasks(todo.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {filteredTodos.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No tasks found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {showCompleted ? 'Try adjusting your filters' : 'Create your first task to get started'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}