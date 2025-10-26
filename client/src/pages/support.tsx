import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Link } from "wouter";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Navbar from "@/components/navbar";
import { Coffee, Heart, Star, ArrowLeft } from "lucide-react";

// Make Stripe optional for development
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

const supportSchema = z.object({
  amount: z.number().min(1, "Amount must be at least $1").max(1000, "Amount cannot exceed $1000"),
  message: z.string().optional(),
});

type SupportFormData = z.infer<typeof supportSchema>;

const presetAmounts = [
  { value: 3, label: "$3", description: "Buy me a coffee", icon: Coffee, popular: false },
  { value: 5, label: "$5", description: "Support development", icon: Heart, popular: true },
  { value: 10, label: "$10", description: "Fuel innovation", icon: Star, popular: false },
];

const CheckoutForm = ({ amount, message }: { amount: number; message: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/support-success`,
      },
    });

    setIsProcessing(false);

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Complete Your Support</h3>
          <p className="text-muted-foreground">
            Supporting ${amount} for MobileToolsBox development
          </p>
          {message && (
            <div className="mt-2 p-3 bg-muted rounded-lg">
              <p className="text-sm italic">"{message}"</p>
            </div>
          )}
        </div>
        
        <Separator />
        
        <PaymentElement />
      </div>
      
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isProcessing}
        size="lg"
      >
        {isProcessing ? "Processing..." : `Support with $${amount}`}
      </Button>
      
      <p className="text-xs text-center text-muted-foreground">
        Powered by Stripe. Your payment information is secure and encrypted.
      </p>
    </form>
  );
};

export default function SupportPage() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [message, setMessage] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [step, setStep] = useState<"select" | "payment">("select");
  const { toast } = useToast();

  const form = useForm<SupportFormData>({
    resolver: zodResolver(supportSchema),
    defaultValues: {
      amount: 5,
      message: "",
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (data: { amount: number; message: string }) => {
      const response = await apiRequest("POST", "/api/support-developer", {
        type: "donation",
        amount: data.amount * 100, // Convert to cents
        message: data.message,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      setStep("payment");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to create payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount("");
    form.setValue("amount", amount);
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      form.setValue("amount", numValue);
    }
  };

  const handleContinue = () => {
    const amount = selectedAmount || parseFloat(customAmount);
    if (amount && amount >= 1) {
      createPaymentMutation.mutate({
        amount,
        message,
      });
    }
  };

  const finalAmount = selectedAmount || parseFloat(customAmount) || 0;

  if (step === "payment" && clientSecret) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <Navbar onBack={() => setStep("select")} title="Complete Payment" />
        
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <Card>
              <CardContent className="p-6">
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm amount={finalAmount} message={message} />
                </Elements>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Navbar onBack={() => window.history.back()} title="Support MobileToolsBox" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-4">
              <Coffee className="h-16 w-16 mx-auto text-orange-500" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Support MobileToolsBox</h1>
            <p className="text-lg text-muted-foreground mb-4">
              Help keep MobileToolsBox free and continuously improving
            </p>
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 backdrop-blur-sm">
              <p className="text-sm text-muted-foreground">
                MobileToolsBox is completely free to use. Your support helps cover development costs 
                and allows us to add new features and tools for everyone.
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Choose Your Support Amount</CardTitle>
              <CardDescription>
                Select a preset amount or enter your own preferred amount
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Preset Amounts */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Popular amounts</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {presetAmounts.map((preset) => {
                    const IconComponent = preset.icon;
                    return (
                      <Card
                        key={preset.value}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedAmount === preset.value
                            ? "ring-2 ring-primary border-primary"
                            : "hover:border-primary/50"
                        }`}
                        onClick={() => handleAmountSelect(preset.value)}
                      >
                        <CardContent className="p-4 text-center">
                          <div className="flex items-center justify-center space-x-2 mb-2">
                            <IconComponent className="h-5 w-5" />
                            <span className="text-lg font-semibold">{preset.label}</span>
                            {preset.popular && (
                              <Badge variant="secondary" className="text-xs">Popular</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{preset.description}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* Custom Amount */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Or enter custom amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    min="1"
                    max="1000"
                    step="0.01"
                    value={customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <Separator />

              {/* Optional Message */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Optional message (public)</label>
                <Textarea
                  placeholder="Say something nice... (optional)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground">
                  {message.length}/200 characters
                </p>
              </div>

              {/* Continue Button */}
              <Button
                onClick={handleContinue}
                disabled={!finalAmount || finalAmount < 1 || createPaymentMutation.isPending}
                size="lg"
                className="w-full"
              >
                {createPaymentMutation.isPending
                  ? "Setting up payment..."
                  : `Continue with $${finalAmount.toFixed(2)}`
                }
              </Button>

              <div className="text-center">
                <Link href="/">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to MobileToolsBox
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Features List */}
          <div className="mt-8 text-center">
            <h3 className="text-lg font-semibold mb-4">Your support helps us:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Keep all tools completely free</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Add new productivity features</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Improve performance and reliability</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Cover hosting and development costs</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}