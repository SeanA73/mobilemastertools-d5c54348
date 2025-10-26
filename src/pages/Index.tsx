import { useState } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FocusTimer from "@/components/FocusTimer";
import TaskManager from "@/components/TaskManager";
import GoalTracker from "@/components/GoalTracker";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      
      {activeTab === "home" && (
        <Hero onGetStarted={() => setActiveTab("timer")} />
      )}
      
      {activeTab === "timer" && <FocusTimer />}
      {activeTab === "tasks" && <TaskManager />}
      {activeTab === "goals" && <GoalTracker />}
    </div>
  );
};

export default Index;
