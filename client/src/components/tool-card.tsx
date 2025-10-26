import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";

type Tool = {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  category: string;
  premium?: boolean;
};

type ToolCardProps = {
  tool: Tool;
  onClick: () => void;
};

const colorMap = {
  blue: "bg-blue-100 text-blue-600",
  emerald: "bg-emerald-100 text-emerald-600",
  red: "bg-red-100 text-red-600",
  purple: "bg-purple-100 text-purple-600",
  orange: "bg-orange-100 text-orange-600",
  cyan: "bg-cyan-100 text-cyan-600",
  yellow: "bg-yellow-100 text-yellow-600",
  pink: "bg-pink-100 text-pink-600",
  indigo: "bg-indigo-100 text-indigo-600",
  green: "bg-green-100 text-green-600",
};

export default function ToolCard({ tool, onClick }: ToolCardProps) {
  const IconComponent = tool.icon;
  const colorClass = colorMap[tool.color as keyof typeof colorMap] || "bg-slate-100 text-slate-600";

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 group border-slate-200 hover:border-primary/20"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="relative">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${colorClass}`}>
            <IconComponent className="w-6 h-6" />
          </div>
          

        </div>
        
        <h3 className="font-semibold text-slate-900 mb-2 group-hover:text-primary transition-colors">
          {tool.name}
        </h3>
        <p className="text-sm text-slate-600 leading-relaxed">
          {tool.description}
        </p>
        
        <div className="mt-3">
          <Badge variant="outline" className="text-xs">
            {tool.category}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
