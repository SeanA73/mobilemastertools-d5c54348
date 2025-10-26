import { Button } from "@/components/ui/button";
import { CheckSquare, Clock, Target } from "lucide-react";

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navbar = ({ activeTab, onTabChange }: NavbarProps) => {
  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-[hsl(230_80%_60%)] flex items-center justify-center">
              <Target className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-[hsl(230_80%_60%)] bg-clip-text text-transparent">
              FlowFocus
            </span>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={activeTab === "home" ? "default" : "ghost"}
              onClick={() => onTabChange("home")}
              className="gap-2"
            >
              Home
            </Button>
            <Button
              variant={activeTab === "timer" ? "default" : "ghost"}
              onClick={() => onTabChange("timer")}
              className="gap-2"
            >
              <Clock className="w-4 h-4" />
              Focus Timer
            </Button>
            <Button
              variant={activeTab === "tasks" ? "default" : "ghost"}
              onClick={() => onTabChange("tasks")}
              className="gap-2"
            >
              <CheckSquare className="w-4 h-4" />
              Tasks
            </Button>
            <Button
              variant={activeTab === "goals" ? "default" : "ghost"}
              onClick={() => onTabChange("goals")}
              className="gap-2"
            >
              <Target className="w-4 h-4" />
              Goals
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
