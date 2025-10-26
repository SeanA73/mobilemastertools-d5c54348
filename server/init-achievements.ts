import { storage } from "./storage";

const initialAchievements = [
  {
    key: "first_todo",
    name: "Getting Started",
    description: "Complete your first todo item",
    category: "productivity",
    icon: "CheckCircle",
    color: "#10b981",
    requirement: { count: 1 },
    points: 10,
    rarity: "common"
  },
  {
    key: "todo_master",
    name: "Todo Master",
    description: "Complete 10 todo items",
    category: "productivity", 
    icon: "Target",
    color: "#3b82f6",
    requirement: { count: 10 },
    points: 50,
    rarity: "rare"
  },
  {
    key: "note_taker",
    name: "Note Taker",
    description: "Create 5 notes",
    category: "productivity",
    icon: "FileText",
    color: "#8b5cf6",
    requirement: { count: 5 },
    points: 30,
    rarity: "common"
  },
  {
    key: "habit_builder",
    name: "Habit Builder",
    description: "Track your first habit",
    category: "consistency",
    icon: "Calendar",
    color: "#f59e0b",
    requirement: { count: 1 },
    points: 20,
    rarity: "common"
  },
  {
    key: "consistency_king",
    name: "Consistency King",
    description: "Maintain a 7-day streak",
    category: "consistency",
    icon: "Flame",
    color: "#ef4444",
    requirement: { days: 7 },
    points: 100,
    rarity: "epic"
  },
  {
    key: "tool_explorer",
    name: "Tool Explorer",
    description: "Use 5 different productivity tools",
    category: "exploration",
    icon: "Compass",
    color: "#06b6d4",
    requirement: { count: 5 },
    points: 75,
    rarity: "rare"
  },
  {
    key: "focus_master",
    name: "Focus Master",
    description: "Complete 1 hour of focused work",
    category: "productivity",
    icon: "Brain",
    color: "#ec4899",
    requirement: { minutes: 60 },
    points: 80,
    rarity: "rare"
  },
  {
    key: "early_adopter",
    name: "Early Adopter",
    description: "One of the first users to try MobileToolsBox",
    category: "milestones",
    icon: "Star",
    color: "#fbbf24",
    requirement: { special: true },
    points: 25,
    rarity: "common"
  },
  {
    key: "supporter",
    name: "Supporter",
    description: "Support the development of MobileToolsBox",
    category: "milestones",
    icon: "Heart",
    color: "#f97316",
    requirement: { donation: true },
    points: 150,
    rarity: "legendary"
  },
  {
    key: "level_5",
    name: "Rising Star",
    description: "Reach level 5",
    category: "milestones",
    icon: "TrendingUp",
    color: "#84cc16",
    requirement: { level: 5 },
    points: 0,
    rarity: "rare"
  }
];

export async function initializeAchievements() {
  console.log("Initializing achievements...");
  
  try {
    const existingAchievements = await storage.getAchievements();
    
    for (const achievement of initialAchievements) {
      const exists = existingAchievements.find(a => a.key === achievement.key);
      if (!exists) {
        await storage.createAchievement(achievement);
        console.log(`Created achievement: ${achievement.name}`);
      }
    }
    
    console.log("Achievements initialization complete!");
  } catch (error) {
    console.error("Error initializing achievements:", error);
  }
}