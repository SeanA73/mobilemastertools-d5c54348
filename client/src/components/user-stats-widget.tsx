import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Target, Flame } from "lucide-react";

interface UserStats {
  id: number;
  userId: string;
  totalPoints: number;
  level: number;
  experiencePoints: number;
  streakDays: number;
  todosCompleted: number;
  notesCreated: number;
  habitsTracked: number;
  flashcardsStudied: number;
  pomodoroSessions: number;
  toolsUsed: string[];
  totalFocusTime: number;
  longestStreak: number;
}

interface UserAchievement {
  id: number;
  userId: string;
  achievementId: number;
  unlockedAt: string;
  isCompleted: boolean;
}

export default function UserStatsWidget() {
  const { data: userStats } = useQuery<UserStats>({
    queryKey: ["/api/user-stats"],
  });

  const { data: userAchievements = [] } = useQuery<UserAchievement[]>({
    queryKey: ["/api/user-achievements"],
  });

  if (!userStats) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground">Loading stats...</div>
        </CardContent>
      </Card>
    );
  }

  const experienceToNextLevel = (userStats.level * 100) - userStats.experiencePoints;
  const progressToNextLevel = (userStats.experiencePoints % 100);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-lg">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <span>Your Progress</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Level and XP */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-300">
                Level {userStats.level}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {userStats.experiencePoints} XP
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {experienceToNextLevel} XP to next level
            </span>
          </div>
          <Progress value={progressToNextLevel} className="h-2" />
        </div>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center space-x-1">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="text-lg font-bold text-primary">{userStats.totalPoints}</span>
            </div>
            <div className="text-xs text-muted-foreground">Total Points</div>
          </div>

          <div className="text-center space-y-1">
            <div className="flex items-center justify-center space-x-1">
              <Star className="h-4 w-4 text-purple-500" />
              <span className="text-lg font-bold text-primary">{userAchievements.length}</span>
            </div>
            <div className="text-xs text-muted-foreground">Achievements</div>
          </div>

          <div className="text-center space-y-1">
            <div className="flex items-center justify-center space-x-1">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-lg font-bold text-primary">{userStats.streakDays}</span>
            </div>
            <div className="text-xs text-muted-foreground">Current Streak</div>
          </div>

          <div className="text-center space-y-1">
            <div className="flex items-center justify-center space-x-1">
              <Target className="h-4 w-4 text-green-500" />
              <span className="text-lg font-bold text-primary">{userStats.todosCompleted}</span>
            </div>
            <div className="text-xs text-muted-foreground">Tasks Done</div>
          </div>
        </div>

        {/* Activity Summary */}
        <div className="pt-2 border-t space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Activity Summary</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Notes:</span>
              <span className="font-medium">{userStats.notesCreated}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Focus Time:</span>
              <span className="font-medium">{userStats.totalFocusTime}m</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Habits:</span>
              <span className="font-medium">{userStats.habitsTracked}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tools Used:</span>
              <span className="font-medium">{userStats.toolsUsed.length}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}