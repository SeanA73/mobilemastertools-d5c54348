import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { 
  ShoppingCart, 
  Loader2, 
  Lock,
  Star,
  Check
} from "lucide-react";

const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

interface Tool {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
}

const availableTools: Tool[] = [
  {
    id: "voice-recorder",
    name: "Voice Recorder Pro",
    description: "Advanced voice recording with transcription",
    price: 9.99,
    features: ["Unlimited recordings", "Audio transcription", "Cloud storage", "Export options"]
  },
  {
    id: "project-timer",
    name: "Project Timer Pro",
    description: "Advanced project time tracking",
    price: 7.99,
    features: ["Unlimited projects", "Detailed analytics", "Team collaboration", "Export reports"]
  },
  {
    id: "flashcards",
    name: "Flashcards Pro",
    description: "Advanced learning with spaced repetition",
    price: 6.99,
    features: ["Unlimited decks", "Spaced repetition algorithm", "Progress analytics", "Import/Export"]
  },
  {
    id: "habit-tracker",
    name: "Habit Tracker Pro",
    description: "Advanced habit tracking and analytics",
    price: 8.99,
    features: ["Unlimited habits", "Advanced statistics", "Goal setting", "Reminder system"]
  }
];

const PurchaseForm = ({ 
  tool, 
  clientSecret, 
  onSuccess 
}: { 
  tool: Tool; 
  clientSecret: string; 
  onSuccess: () => void; 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/app",
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Purchase Successful!",
        description: `You now have access to ${tool.name}`,
      });
      onSuccess();
    }

    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          Complete Purchase
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
            <div>
              <h3 className="font-semibold">{tool.name}</h3>
              <p className="text-sm text-muted-foreground">{tool.description}</p>
            </div>
            <div className="text-2xl font-bold">${tool.price}</div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <PaymentElement />
            <Button 
              type="submit" 
              className="w-full" 
              disabled={!stripe || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Pay ${tool.price}
                </>
              )}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};

interface OneTimePurchaseProps {
  toolId?: string;
  onClose?: () => void;
}

export default function OneTimePurchase({ toolId, onClose }: OneTimePurchaseProps) {
  const [selectedTool, setSelectedTool] = useState<Tool | null>(
    toolId ? availableTools.find(t => t.id === toolId) || null : null
  );
  const [clientSecret, setClientSecret] = useState("");
  const { toast } = useToast();

  const purchaseToolMutation = useMutation({
    mutationFn: (tool: Tool) => apiRequest("POST", "/api/purchase-tool", {
      toolId: tool.id,
      toolName: tool.name,
      amount: tool.price
    }),
    onSuccess: (data: any) => {
      setClientSecret(data.clientSecret);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to initialize purchase. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePurchaseClick = (tool: Tool) => {
    setSelectedTool(tool);
    purchaseToolMutation.mutate(tool);
  };

  const handlePaymentSuccess = () => {
    setSelectedTool(null);
    setClientSecret("");
    if (onClose) onClose();
  };

  const handleBack = () => {
    setSelectedTool(null);
    setClientSecret("");
  };

  if (selectedTool && clientSecret) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={handleBack}>
          ← Back to Tools
        </Button>
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <PurchaseForm 
            tool={selectedTool} 
            clientSecret={clientSecret}
            onSuccess={handlePaymentSuccess} 
          />
        </Elements>
      </div>
    );
  }

  if (selectedTool && purchaseToolMutation.isPending) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="ml-2">Preparing purchase...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Premium Tools</h2>
        <p className="text-muted-foreground">
          Purchase individual tools with lifetime access. No subscription required.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {availableTools.map((tool) => (
          <Card key={tool.id} className="relative">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{tool.name}</span>
                <Badge variant="secondary">
                  <Lock className="w-3 h-3 mr-1" />
                  Pro
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">{tool.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold">${tool.price}</div>
              
              <div className="space-y-2">
                {tool.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    {feature}
                  </div>
                ))}
              </div>

              <Button 
                onClick={() => handlePurchaseClick(tool)}
                disabled={purchaseToolMutation.isPending}
                className="w-full"
              >
                {purchaseToolMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Buy Now
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Star className="w-8 h-8 text-primary" />
            <div>
              <h3 className="font-semibold">Support Development</h3>
              <p className="text-sm text-muted-foreground">
                Get lifetime access to all features for just $9.99 one-time payment.
              </p>
            </div>
            <Button asChild className="ml-auto">
              <a href="/pricing">Get Lifetime Access</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}