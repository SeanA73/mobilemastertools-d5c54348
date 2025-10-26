import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Pause, RotateCcw } from "lucide-react";
import { toast } from "sonner";

const FocusTimer = () => {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && (minutes > 0 || seconds > 0)) {
      interval = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            setIsActive(false);
            toast.success("Focus session complete! Time for a break.", {
              duration: 5000,
            });
          } else {
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        } else {
          setSeconds(seconds - 1);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, minutes, seconds]);

  const toggleTimer = () => {
    setIsActive(!isActive);
    if (!isActive && minutes === 25 && seconds === 0) {
      toast.info("Focus session started!");
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    setMinutes(25);
    setSeconds(0);
  };

  const progress = ((25 * 60 - (minutes * 60 + seconds)) / (25 * 60)) * 100;

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center p-4">
      <Card className="p-8 md:p-12 max-w-md w-full text-center space-y-8 shadow-[var(--shadow-card)]">
        <div>
          <h2 className="text-2xl font-bold mb-2">Focus Timer</h2>
          <p className="text-muted-foreground">Stay focused with the Pomodoro technique</p>
        </div>

        <div className="relative">
          <svg className="w-64 h-64 mx-auto -rotate-90">
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-muted"
            />
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="url(#gradient)"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 120}`}
              strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
              className="transition-all duration-1000"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(262 80% 55%)" />
                <stop offset="100%" stopColor="hsl(230 80% 60%)" />
              </linearGradient>
            </defs>
          </svg>
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl font-bold tabular-nums">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <Button
            size="lg"
            onClick={toggleTimer}
            className="gap-2"
          >
            {isActive ? (
              <>
                <Pause className="w-5 h-5" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Start
              </>
            )}
          </Button>
          <Button size="lg" variant="outline" onClick={resetTimer} className="gap-2">
            <RotateCcw className="w-5 h-5" />
            Reset
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4">
          <Button
            variant="ghost"
            onClick={() => {
              setMinutes(15);
              setSeconds(0);
              setIsActive(false);
            }}
          >
            15 min
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setMinutes(25);
              setSeconds(0);
              setIsActive(false);
            }}
          >
            25 min
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setMinutes(45);
              setSeconds(0);
              setIsActive(false);
            }}
          >
            45 min
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default FocusTimer;
