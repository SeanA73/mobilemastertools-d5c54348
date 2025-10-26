import { Button } from "@/components/ui/button";
import { ArrowLeft, Drill, MessageSquare, DollarSign, Settings as SettingsIcon } from "lucide-react";

type NavbarProps = {
  onBack?: () => void;
  title?: string;
  onFeedbackClick?: () => void;
  onRevenueClick?: () => void;
  onSettingsClick?: () => void;
  isAdmin?: boolean;
};

export default function Navbar({ onBack, title, onFeedbackClick, onRevenueClick, onSettingsClick, isAdmin }: NavbarProps) {
  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-slate-200/60 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-3">
          {onBack ? (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                <Drill className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">MobileToolsBox</span>
            </div>
          )}
          
          {title && (
            <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {!onBack && (
            <>
              <Button variant="ghost" size="sm" onClick={onFeedbackClick}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Feedback
              </Button>
              
              {isAdmin && (
                <Button variant="ghost" size="sm" onClick={onRevenueClick}>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Revenue
                </Button>
              )}

              <Button variant="ghost" size="sm" onClick={onSettingsClick}>
                <SettingsIcon className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
