import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Theme Store
interface ThemeState {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => {
        set({ theme });
        
        // Apply theme to document
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        
        if (theme === 'system') {
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          root.classList.add(systemTheme);
        } else {
          root.classList.add(theme);
        }
      },
    }),
    {
      name: 'theme-storage',
    }
  )
);

// User Preferences Store
interface UserPreferencesState {
  notifications: boolean;
  soundEnabled: boolean;
  defaultPomodoroTime: number;
  defaultBreakTime: number;
  weekStartsOn: 0 | 1; // 0 = Sunday, 1 = Monday
  timeFormat: '12h' | '24h';
  setNotifications: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setDefaultPomodoroTime: (minutes: number) => void;
  setDefaultBreakTime: (minutes: number) => void;
  setWeekStartsOn: (day: 0 | 1) => void;
  setTimeFormat: (format: '12h' | '24h') => void;
}

export const useUserPreferencesStore = create<UserPreferencesState>()(
  persist(
    (set) => ({
      notifications: true,
      soundEnabled: true,
      defaultPomodoroTime: 25,
      defaultBreakTime: 5,
      weekStartsOn: 1,
      timeFormat: '24h',
      setNotifications: (notifications) => set({ notifications }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      setDefaultPomodoroTime: (defaultPomodoroTime) => set({ defaultPomodoroTime }),
      setDefaultBreakTime: (defaultBreakTime) => set({ defaultBreakTime }),
      setWeekStartsOn: (weekStartsOn) => set({ weekStartsOn }),
      setTimeFormat: (timeFormat) => set({ timeFormat }),
    }),
    {
      name: 'user-preferences-storage',
    }
  )
);

// App State Store
interface AppStateState {
  isOnline: boolean;
  lastSync: Date | null;
  pendingSyncs: number;
  isLoading: boolean;
  setOnlineStatus: (isOnline: boolean) => void;
  setLastSync: (date: Date) => void;
  setPendingSyncs: (count: number) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const useAppStateStore = create<AppStateState>((set) => ({
  isOnline: navigator.onLine,
  lastSync: null,
  pendingSyncs: 0,
  isLoading: false,
  setOnlineStatus: (isOnline) => set({ isOnline }),
  setLastSync: (lastSync) => set({ lastSync }),
  setPendingSyncs: (pendingSyncs) => set({ pendingSyncs }),
  setIsLoading: (isLoading) => set({ isLoading }),
}));

// Tool State Store (for managing tool-specific state)
interface ToolStateState {
  lastUsedTool: string | null;
  toolPreferences: Record<string, any>;
  setLastUsedTool: (toolId: string) => void;
  setToolPreference: (toolId: string, preferences: any) => void;
  getToolPreference: (toolId: string) => any;
}

export const useToolStateStore = create<ToolStateState>()(
  persist(
    (set, get) => ({
      lastUsedTool: null,
      toolPreferences: {},
      setLastUsedTool: (lastUsedTool) => set({ lastUsedTool }),
      setToolPreference: (toolId, preferences) => {
        const { toolPreferences } = get();
        set({
          toolPreferences: {
            ...toolPreferences,
            [toolId]: { ...toolPreferences[toolId], ...preferences },
          },
        });
      },
      getToolPreference: (toolId) => {
        const { toolPreferences } = get();
        return toolPreferences[toolId] || {};
      },
    }),
    {
      name: 'tool-state-storage',
    }
  )
);

// Subscription Store
interface SubscriptionState {
  isSubscribed: boolean;
  subscriptionType: 'free' | 'pro' | 'lifetime';
  subscriptionExpiry: Date | null;
  features: string[];
  setSubscription: (type: 'free' | 'pro' | 'lifetime', expiry?: Date) => void;
  hasFeature: (feature: string) => boolean;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      isSubscribed: false,
      subscriptionType: 'free',
      subscriptionExpiry: null,
      // All features are now available to everyone!
      features: [
        'todos', 'notes', 'calculator', 'timer', 'unit-converter', 'world-clock',
        'voice-recorder', 'flashcards', 'pomodoro', 'habit-tracker', 'cloud-sync',
        'project-timer', 'iq-test', 'advanced-analytics', 'export-data'
      ],
      setSubscription: (subscriptionType, subscriptionExpiry) => {
        // All features available regardless of subscription type
        const features = [
          'todos', 'notes', 'calculator', 'timer', 'unit-converter', 'world-clock',
          'voice-recorder', 'flashcards', 'pomodoro', 'habit-tracker', 'cloud-sync',
          'project-timer', 'iq-test', 'advanced-analytics', 'export-data'
        ];

        set({
          isSubscribed: subscriptionType !== 'free',
          subscriptionType,
          subscriptionExpiry: subscriptionExpiry || null,
          features,
        });
      },
      hasFeature: (feature) => {
        // All features are available to everyone
        return true;
      },
    }),
    {
      name: 'subscription-storage',
    }
  )
);

// Initialize online status listener
window.addEventListener('online', () => {
  useAppStateStore.getState().setOnlineStatus(true);
});

window.addEventListener('offline', () => {
  useAppStateStore.getState().setOnlineStatus(false);
});

// Initialize theme on app start
const { theme, setTheme } = useThemeStore.getState();
setTheme(theme);

// Listen for system theme changes
if (theme === 'system') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (useThemeStore.getState().theme === 'system') {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(e.matches ? 'dark' : 'light');
    }
  });
}
