import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

const TaskManager = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");

  const addTask = () => {
    if (newTask.trim()) {
      setTasks([
        ...tasks,
        { id: Date.now().toString(), text: newTask, completed: false },
      ]);
      setNewTask("");
      toast.success("Task added!");
    }
  };

  const toggleTask = (id: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id));
    toast.success("Task deleted");
  };

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">Task Manager</h2>
          <p className="text-muted-foreground">
            Keep track of your daily tasks and stay organized
          </p>
        </div>

        <Card className="p-6 shadow-[var(--shadow-card)]">
          <div className="flex gap-2 mb-6">
            <Input
              placeholder="Add a new task..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addTask()}
              className="flex-1"
            />
            <Button onClick={addTask} className="gap-2">
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </div>

          {tasks.length > 0 && (
            <div className="mb-4 p-3 rounded-lg bg-muted/50 flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {completedCount} of {tasks.length} tasks completed
              </span>
              <div className="h-2 w-32 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                  style={{ width: `${(completedCount / tasks.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            {tasks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No tasks yet. Add one to get started!
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => toggleTask(task.id)}
                  />
                  <span
                    className={`flex-1 ${
                      task.completed
                        ? "line-through text-muted-foreground"
                        : ""
                    }`}
                  >
                    {task.text}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TaskManager;
