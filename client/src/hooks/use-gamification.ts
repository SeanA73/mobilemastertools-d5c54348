import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

interface Achievement {
  id: number;
  key: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  points: number;
  rarity: string;
}

interface TrackActivityResponse {
  stats: any;
  newAchievements: Achievement[] | null;
}

export function useGamification() {
  const [pendingAchievement, setPendingAchievement] = useState<Achievement | null>(null);
  const queryClient = useQueryClient();

  const trackActivityMutation = useMutation({
    mutationFn: async ({ activity, amount }: { activity: string; amount?: number }): Promise<TrackActivityResponse> => {
      const response = await apiRequest("POST", "/api/track-activity", { activity, amount });
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to track activity');
    },
    onSuccess: (data: TrackActivityResponse) => {
      // Invalidate relevant queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ["/api/user-stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user-achievements"] });
      
      // Show achievement notification if new achievements were unlocked
      if (data.newAchievements && data.newAchievements.length > 0) {
        // Show the first new achievement (in case multiple were unlocked)
        setPendingAchievement(data.newAchievements[0]);
      }
    },
    onError: (error) => {
      console.error("Failed to track activity:", error);
    }
  });

  const trackActivity = (activity: string, amount?: number) => {
    trackActivityMutation.mutate({ activity, amount });
  };

  const clearAchievementNotification = () => {
    setPendingAchievement(null);
  };

  return {
    trackActivity,
    pendingAchievement,
    clearAchievementNotification,
    isTracking: trackActivityMutation.isPending
  };
}