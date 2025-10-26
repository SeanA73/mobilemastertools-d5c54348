import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";
import heroImage from "@/assets/hero-productivity.jpg";

interface HeroProps {
  onGetStarted: () => void;
}

const Hero = ({ onGetStarted }: HeroProps) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium">
              <Zap className="w-4 h-4" />
              Boost Your Productivity
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
              Focus Better,{" "}
              <span className="bg-gradient-to-r from-primary to-[hsl(230_80%_60%)] bg-clip-text text-transparent">
                Achieve More
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground leading-relaxed">
              Transform your workday with powerful tools designed to help you stay focused, 
              manage tasks efficiently, and reach your goals faster.
            </p>
            
            <div className="flex gap-4">
              <Button 
                size="lg" 
                onClick={onGetStarted}
                className="gap-2 shadow-[var(--shadow-soft)] hover:shadow-[0_8px_32px_-4px_hsl(262_80%_55%/0.25)] transition-all"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </div>

            <div className="flex gap-8 pt-4">
              <div>
                <div className="text-3xl font-bold text-primary">10K+</div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">50M+</div>
                <div className="text-sm text-muted-foreground">Tasks Completed</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">4.9★</div>
                <div className="text-sm text-muted-foreground">User Rating</div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-3xl blur-3xl" />
            <img 
              src={heroImage} 
              alt="Productivity workspace with laptop and coffee" 
              className="relative rounded-2xl shadow-[var(--shadow-card)] w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
