import { useQuery } from '@tanstack/react-query';
import { useSubscriptionStore } from '@/lib/stores';
import { useEffect } from 'react';

export interface User {
  id: number;
  email: string;
  username: string;
  subscriptionStatus: 'free' | 'pro' | 'lifetime';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export function useSubscription() {
  const {
    isSubscribed,
    subscriptionType,
    subscriptionExpiry,
    features,
    setSubscription,
    hasFeature,
  } = useSubscriptionStore();

  // Fetch user data to get subscription status
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/user'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update subscription store when user data changes
  useEffect(() => {
    if (user?.subscriptionStatus) {
      setSubscription(user.subscriptionStatus);
    }
  }, [user?.subscriptionStatus, setSubscription]);

  const checkFeatureAccess = (feature: string): { hasAccess: boolean; reason?: string } => {
    if (hasFeature(feature)) {
      return { hasAccess: true };
    }

    // Check if subscription has expired
    if (subscriptionExpiry && new Date() > subscriptionExpiry) {
      return {
        hasAccess: false,
        reason: 'Your subscription has expired. Please renew to continue using premium features.',
      };
    }

    return {
      hasAccess: false,
      reason: 'This feature requires a Pro subscription. Upgrade to unlock all premium features.',
    };
  };

  const getPremiumFeatures = () => [
    'voice-recorder',
    'flashcards',
    'pomodoro',
    'habit-tracker',
    'cloud-sync',
    'advanced-analytics',
    'export-data',
    'priority-support',
  ];

  const getFeatureList = () => {
    const allFeatures = {
      'todos': {
        name: 'To-Do Lists',
        description: 'Create and manage tasks with priorities and due dates',
        premium: false,
      },
      'notes': {
        name: 'Notes',
        description: 'Rich text note-taking with folders and search',
        premium: false,
      },
      'calculator': {
        name: 'Calculator',
        description: 'Basic and scientific calculator functions',
        premium: false,
      },
      'timer': {
        name: 'Timer',
        description: 'Countdown timers for various tasks',
        premium: false,
      },
      'unit-converter': {
        name: 'Unit Converter',
        description: 'Convert between different units of measurement',
        premium: false,
      },
      'world-clock': {
        name: 'World Clock',
        description: 'Track multiple time zones',
        premium: false,
      },
      'voice-recorder': {
        name: 'Voice Recorder',
        description: 'Record and manage audio memos',
        premium: true,
      },
      'flashcards': {
        name: 'Flashcards',
        description: 'Study with spaced repetition algorithm',
        premium: true,
      },
      'pomodoro': {
        name: 'Pomodoro Timer',
        description: 'Focus sessions with break intervals',
        premium: true,
      },
      'habit-tracker': {
        name: 'Habit Tracker',
        description: 'Build and track positive habits',
        premium: true,
      },
      'cloud-sync': {
        name: 'Cloud Sync',
        description: 'Sync data across all your devices',
        premium: true,
      },
    };

    return allFeatures;
  };

  const getSubscriptionInfo = () => {
    const info = {
      type: subscriptionType,
      isActive: isSubscribed,
      expiry: subscriptionExpiry,
      daysRemaining: subscriptionExpiry 
        ? Math.max(0, Math.ceil((subscriptionExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : null,
    };

    return info;
  };

  const canUpgrade = () => {
    return subscriptionType === 'free';
  };

  const needsRenewal = () => {
    if (!subscriptionExpiry || subscriptionType === 'lifetime') return false;
    
    const daysRemaining = Math.ceil((subscriptionExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysRemaining <= 7; // Show renewal notice if 7 days or less remaining
  };

  const getUpgradeUrl = () => {
    return '/subscribe';
  };

  const getManageUrl = () => {
    // In a real app, this would link to Stripe customer portal
    return '/subscribe';
  };

  return {
    // Subscription status
    isSubscribed,
    subscriptionType,
    subscriptionExpiry,
    isLoading,
    user,

    // Feature access
    hasFeature,
    checkFeatureAccess,
    features,

    // Feature information
    getPremiumFeatures,
    getFeatureList,

    // Subscription management
    getSubscriptionInfo,
    canUpgrade,
    needsRenewal,
    getUpgradeUrl,
    getManageUrl,

    // Utility functions
    isPro: subscriptionType === 'pro',
    isLifetime: subscriptionType === 'lifetime',
    isFree: subscriptionType === 'free',
  };
}

// Hook for checking if a specific feature is available
export function useFeatureAccess(feature: string) {
  return {
    hasAccess: true, // All features are now free
    reason: 'available',
    isAvailable: true,
  };
}

// Hook for premium feature gate
export function usePremiumFeature(feature: string) {
  return {
    hasAccess: true, // All features are now free
    reason: 'available',
    requireUpgrade: () => {}, // No upgrade needed
    upgradeUrl: null,
  };
}
