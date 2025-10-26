import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Trophy, Star, CheckCircle, Target, FileText, Calendar, 
  Flame, Compass, Brain, Heart, TrendingUp 
} from "lucide-react";

const iconMap = {
  CheckCircle, Target, FileText, Calendar, Flame, 
  Compass, Brain, Star, Heart, TrendingUp, Trophy
};

interface Achievement {
  id: number;
  key: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  requirement: any;
  points: number;
  rarity: string;
  isActive: boolean;
}

interface UserAchievement {
  id: number;
  userId: string;
  achievementId: number;
  unlockedAt: string;
  isCompleted: boolean;
}

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

export default function AchievementsPanel() {
  const { data: achievements = [] } = useQuery<Achievement[]>({
    queryKey: ["/api/achievements"],
  });

  const { data: userAchievements = [] } = useQuery<UserAchievement[]>({
    queryKey: ["/api/user-achievements"],
  });

  const { data: userStats } = useQuery<UserStats>({
    queryKey: ["/api/user-stats"],
  });

  const unlockedAchievementIds = userAchievements.map(ua => ua.achievementId);
  const categorizedAchievements = achievements.reduce((acc, achievement) => {
    const category = achievement.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      case 'rare': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'epic': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'legendary': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getProgressForAchievement = (achievement: Achievement): number => {
    if (!userStats) return 0;
    
    switch (achievement.key) {
      case 'first_todo':
        return Math.min((userStats.todosCompleted / 1) * 100, 100);
      case 'todo_master':
        return Math.min((userStats.todosCompleted / 10) * 100, 100);
      case 'note_taker':
        return Math.min((userStats.notesCreated / 5) * 100, 100);
      case 'habit_builder':
        return Math.min((userStats.habitsTracked / 1) * 100, 100);
      case 'consistency_king':
        return Math.min((userStats.streakDays / 7) * 100, 100);
      case 'tool_explorer':
        return Math.min((userStats.toolsUsed.length / 5) * 100, 100);
      case 'focus_master':
        return Math.min((userStats.totalFocusTime / 60) * 100, 100);
      case 'level_5':
        return Math.min((userStats.level / 5) * 100, 100);
      default:
        return unlockedAchievementIds.includes(achievement.id) ? 100 : 0;
    }
  };

  const AchievementCard = ({ achievement, isUnlocked }: { achievement: Achievement; isUnlocked: boolean }) => {
    const IconComponent = iconMap[achievement.icon as keyof typeof iconMap] || Trophy;
    const progress = getProgressForAchievement(achievement);
    
    return (
      <Card className={`transition-all hover:shadow-md ${isUnlocked ? 'ring-2 ring-green-200 dark:ring-green-800' : 'opacity-75'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: achievement.color + '20', color: achievement.color }}
              >
                <IconComponent className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium">{achievement.name}</CardTitle>
                <CardDescription className="text-xs">{achievement.description}</CardDescription>
              </div>
            </div>
            <Badge className={getRarityColor(achievement.rarity)} variant="secondary">
              {achievement.rarity}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">
                {achievement.points} points
              </span>
              {isUnlocked && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-300">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Unlocked
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* User Stats Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5" />
            <span>Your Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userStats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center space-y-1">
                <div className="text-2xl font-bold text-primary">{userStats.level}</div>
                <div className="text-xs text-muted-foreground">Level</div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-2xl font-bold text-primary">{userStats.totalPoints}</div>
                <div className="text-xs text-muted-foreground">Total Points</div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-2xl font-bold text-primary">{userStats.streakDays}</div>
                <div className="text-xs text-muted-foreground">Current Streak</div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-2xl font-bold text-primary">{userAchievements.length}</div>
                <div className="text-xs text-muted-foreground">Achievements</div>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">Loading stats...</div>
          )}
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
          <CardDescription>
            Unlock achievements by using MobileToolsBox and completing productivity milestones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="productivity">Productivity</TabsTrigger>
              <TabsTrigger value="consistency">Consistency</TabsTrigger>
              <TabsTrigger value="exploration">Exploration</TabsTrigger>
              <TabsTrigger value="milestones">Milestones</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-4">
              <ScrollArea className="h-96">
                <div className="grid gap-3">
                  {achievements.map(achievement => (
                    <AchievementCard
                      key={achievement.id}
                      achievement={achievement}
                      isUnlocked={unlockedAchievementIds.includes(achievement.id)}
                    />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {Object.entries(categorizedAchievements).map(([category, categoryAchievements]) => (
              <TabsContent key={category} value={category} className="mt-4">
                <ScrollArea className="h-96">
                  <div className="grid gap-3">
                    {categoryAchievements.map(achievement => (
                      <AchievementCard
                        key={achievement.id}
                        achievement={achievement}
                        isUnlocked={unlockedAchievementIds.includes(achievement.id)}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}