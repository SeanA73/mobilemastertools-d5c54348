import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Plus, TrendingUp, Target } from "lucide-react";
import { toast } from "sonner";

interface Goal {
  id: string;
  title: string;
  current: number;
  target: number;
}

const GoalTracker = () => {
  const [goals, setGoals] = useState<Goal[]>([
    { id: "1", title: "Read Books", current: 3, target: 12 },
    { id: "2", title: "Exercise Sessions", current: 8, target: 20 },
  ]);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");

  const addGoal = () => {
    if (newGoalTitle.trim() && newGoalTarget) {
      setGoals([
        ...goals,
        {
          id: Date.now().toString(),
          title: newGoalTitle,
          current: 0,
          target: parseInt(newGoalTarget),
        },
      ]);
      setNewGoalTitle("");
      setNewGoalTarget("");
      toast.success("Goal added!");
    }
  };

  const incrementGoal = (id: string) => {
    setGoals(
      goals.map((goal) => {
        if (goal.id === id) {
          const newCurrent = Math.min(goal.current + 1, goal.target);
          if (newCurrent === goal.target) {
            toast.success("🎉 Goal completed!", {
              description: `Congratulations on completing "${goal.title}"!`,
            });
          }
          return { ...goal, current: newCurrent };
        }
        return goal;
      })
    );
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">Goal Tracker</h2>
          <p className="text-muted-foreground">
            Set and track your personal and professional goals
          </p>
        </div>

        <Card className="p-6 shadow-[var(--shadow-card)]">
          <div className="grid md:grid-cols-3 gap-3 mb-6">
            <Input
              placeholder="Goal title..."
              value={newGoalTitle}
              onChange={(e) => setNewGoalTitle(e.target.value)}
              className="md:col-span-2"
            />
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Target"
                value={newGoalTarget}
                onChange={(e) => setNewGoalTarget(e.target.value)}
                className="w-24"
              />
              <Button onClick={addGoal} className="gap-2">
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {goals.map((goal) => {
              const progress = (goal.current / goal.target) * 100;
              const isComplete = goal.current === goal.target;

              return (
                <Card
                  key={goal.id}
                  className="p-5 space-y-4 border-2 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{goal.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Target className="w-4 h-4" />
                        <span>
                          {goal.current} / {goal.target}
                        </span>
                      </div>
                    </div>
                    {isComplete && (
                      <div className="px-2 py-1 rounded-full bg-accent/20 text-accent text-xs font-medium">
                        Complete
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Progress value={progress} className="h-2" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-primary">
                        {Math.round(progress)}%
                      </span>
                      <Button
                        size="sm"
                        variant={isComplete ? "outline" : "default"}
                        onClick={() => incrementGoal(goal.id)}
                        disabled={isComplete}
                        className="gap-1"
                      >
                        <TrendingUp className="w-3 h-3" />
                        Progress
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {goals.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No goals yet. Set your first goal to get started!
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default GoalTracker;
