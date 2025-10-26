import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Coffee, UtensilsCrossed, DollarSign } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DonationModal({ isOpen, onClose }: DonationModalProps) {
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
        onClose();
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-gray-900 dark:text-white">
            Support Development
          </DialogTitle>
          <p className="text-center text-orange-600 dark:text-orange-400 font-bold mt-2">
            All features are 100% FREE. Forever!
          </p>
          <p className="text-center text-gray-600 dark:text-gray-300 mt-1">
            Love MobileToolsBox? Buy me a coffee to help keep it free for everyone!
          </p>
        </DialogHeader>

        {/* Donation Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {DONATION_TIERS.map((tier) => {
            const IconComponent = tier.icon;
            return (
              <Card 
                key={tier.id} 
                className={`relative text-center transition-all duration-300 hover:scale-105 hover:shadow-lg border-2 cursor-pointer ${
                  tier.popular 
                    ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600'
                }`}
                onClick={() => handleDonation(tier)}
              >
                {tier.popular && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <CardHeader className="pb-3">
                  <div className={`mx-auto mb-3 w-12 h-12 rounded-full flex items-center justify-center ${
                    tier.popular 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-orange-100 dark:bg-orange-900 text-orange-600'
                  }`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  
                  <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                    {tier.name}
                  </CardTitle>
                  
                  <div className={`text-2xl font-bold ${
                    tier.popular ? 'text-orange-600' : 'text-gray-900 dark:text-white'
                  }`}>
                    ${tier.price}
                  </div>
                </CardHeader>
                
                <CardContent className="pb-4">
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                    {tier.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                    {tier.impact}
                  </p>
                  
                  <Button
                    className={`w-full mt-3 font-medium transition-all duration-200 ${
                      tier.popular
                        ? 'bg-orange-600 hover:bg-orange-700 text-white'
                        : 'bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white'
                    }`}
                    disabled={donateMutation.isPending}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDonation(tier);
                    }}
                  >
                    {donateMutation.isPending ? "Processing..." : `Donate $${tier.price}`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Custom Amount */}
        <Card className="mt-4 border-2 border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-100 dark:bg-purple-900 text-purple-600">
                <DollarSign className="w-5 h-5" />
              </div>
              <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                Custom Amount
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <div className="flex-1">
                <Label htmlFor="custom-amount-modal" className="sr-only">Amount (USD)</Label>
                <Input
                  id="custom-amount-modal"
                  type="number"
                  min="1"
                  max="100"
                  step="0.01"
                  placeholder="Enter amount ($1 - $100)"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                />
              </div>
              <Button
                className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={handleCustomDonation}
                disabled={donateMutation.isPending || !customAmount}
              >
                {donateMutation.isPending ? "Processing..." : "Donate"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
          <p className="text-center text-sm text-orange-800 dark:text-orange-200">
            <Heart className="w-4 h-4 inline mr-1" />
            All tools are completely free. Your support helps cover server costs and development time!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}