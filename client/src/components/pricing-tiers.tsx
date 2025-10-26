import { Star, Coffee, UtensilsCrossed, Heart, DollarSign, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Link, useLocation } from "wouter";

const DONATION_TIERS = [
  {
    id: "coffee",
    name: "Buy me a coffee",
    price: 3,
    description: "Support development with a coffee ☕",
    impact: "Covers 30 minutes of development",
    icon: Coffee,
    popular: false
  },
  {
    id: "lunch",
    name: "Buy me lunch",
    price: 5,
    description: "Keep me fueled while coding 🥗",
    impact: "Covers 1 hour of development",
    icon: UtensilsCrossed,
    popular: true
  },
  {
    id: "generous",
    name: "Generous support",
    price: 10,
    description: "Your generous support means everything! 💝",
    impact: "Covers cloud hosting for 1 month",
    icon: Heart,
    popular: false
  }
];

export default function PricingTiers() {
  const { toast } = useToast();
  const [customAmount, setCustomAmount] = useState("");

  const donateMutation = useMutation({
    mutationFn: async ({ amount, tier }: { amount: number; tier: string }) => {
      const response = await apiRequest("POST", "/api/donate", {
        amount,
        tier,
        message: "Thank you for supporting MobileToolsBox development!"
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      console.log("Donation response:", data);
      if (data.clientSecret) {
        window.location.href = `/checkout?client_secret=${data.clientSecret}`;
      } else {
        toast({
          title: "Error",
          description: "Failed to create payment session. Please try again.",
          variant: "destructive"
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process donation. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleDonation = (tier: typeof DONATION_TIERS[0]) => {
    donateMutation.mutate({
      amount: tier.price * 100, // Convert to cents
      tier: tier.id
    });
  };

  const handleCustomDonation = () => {
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount < 1) {
      toast({
        title: "Invalid Amount",
        description: "Please enter an amount of at least $1",
        variant: "destructive"
      });
      return;
    }
    if (amount > 100) {
      toast({
        title: "Amount Too Large",
        description: "Maximum donation amount is $100. For larger contributions, please contact us.",
        variant: "destructive"
      });
      return;
    }
    donateMutation.mutate({
      amount: Math.round(amount * 100), // Convert to cents
      tier: "custom"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/app">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to App
            </Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <Home className="w-4 h-4" />
              Home
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-12 px-4">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 dark:bg-orange-900 rounded-full mb-6">
            <Coffee className="w-10 h-10 text-orange-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Support Development
          </h1>
          <p className="text-2xl text-orange-600 dark:text-orange-400 font-bold mb-4">
            All features are 100% FREE. Forever. 🎉
          </p>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Love MobileToolsBox? Buy me a coffee to support continued development and help keep it free for everyone!
          </p>
        </div>

        {/* Donation Tiers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-5xl mx-auto">
          {DONATION_TIERS.map((tier) => {
            const IconComponent = tier.icon;
            return (
              <Card 
                key={tier.id} 
                className={`relative text-center transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 ${
                  tier.popular 
                    ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <CardHeader className="pb-4">
                  <div className={`mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center ${
                    tier.popular 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-orange-100 dark:bg-orange-900 text-orange-600'
                  }`}>
                    <IconComponent className="w-8 h-8" />
                  </div>
                  
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                    {tier.name}
                  </CardTitle>
                  
                  <div className={`text-3xl font-bold mt-2 ${
                    tier.popular ? 'text-orange-600' : 'text-gray-900 dark:text-white'
                  }`}>
                    ${tier.price}
                  </div>
                </CardHeader>
                
                <CardContent className="pb-6">
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                    {tier.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                    {tier.impact}
                  </p>
                </CardContent>
                
                <CardFooter>
                  <Button
                    className={`w-full font-medium transition-all duration-200 ${
                      tier.popular
                        ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg'
                        : 'bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white'
                    }`}
                    onClick={() => handleDonation(tier)}
                    disabled={donateMutation.isPending}
                  >
                    {donateMutation.isPending ? "Processing..." : `Donate $${tier.price}`}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Custom Amount Card */}
        <Card className="max-w-md mx-auto mb-12 border-2 border-gray-200 dark:border-gray-700">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center bg-purple-100 dark:bg-purple-900 text-purple-600">
              <DollarSign className="w-8 h-8" />
            </div>
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
              Custom Amount
            </CardTitle>
            <CardDescription>
              Choose your own amount ($1 - $100)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="custom-amount">Amount (USD)</Label>
                <Input
                  id="custom-amount"
                  type="number"
                  min="1"
                  max="100"
                  step="0.01"
                  placeholder="Enter amount"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                onClick={handleCustomDonation}
                disabled={donateMutation.isPending || !customAmount}
              >
                {donateMutation.isPending ? "Processing..." : "Donate Custom Amount"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Thank You Section */}
        <Card className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0">
          <CardContent className="text-center py-8">
            <Star className="w-12 h-12 mx-auto mb-4 text-yellow-200" />
            <h3 className="text-2xl font-bold mb-3">Thank You for Your Support!</h3>
            <p className="text-lg text-orange-100 max-w-2xl mx-auto mb-4">
              Every donation helps cover server costs, development time, and enables new features. 
              Your contribution makes a real difference in keeping MobileToolsBox free and improving for everyone!
            </p>
            <Link href="/app">
              <Button variant="secondary" className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to App
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}