import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { 
  Crown, 
  Loader2, 
  Check, 
  X, 
  Calendar,
  CreditCard,
  Star,
  Shield,
  Zap
} from "lucide-react";

const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

interface SubscriptionData {
  status: string;
  isPro: boolean;
  subscription: {
    id: string;
    status: string;
    current_period_end: number;
    cancel_at_period_end: boolean;
    canceled_at?: number;
  } | null;
}

const SubscriptionForm = ({ onSuccess }: { onSuccess: () => void }) => {
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
        title: "Welcome to Pro!",
        description: "Your subscription is now active. Enjoy all premium features!",
      });
      onSuccess();
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
            <Crown className="w-4 h-4 mr-2" />
            Subscribe to Pro - $4.99/month
          </>
        )}
      </Button>
    </form>
  );
};

export default function SubscriptionManagement() {
  const [clientSecret, setClientSecret] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch subscription status
  const { data: subscriptionData, isLoading: statusLoading, refetch } = useQuery<SubscriptionData>({
    queryKey: ['/api/subscription-status'],
  });

  // Create subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/create-subscription"),
    onSuccess: (data: any) => {
      setClientSecret(data.clientSecret);
      setShowPaymentForm(true);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to initialize subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/cancel-subscription"),
    onSuccess: () => {
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription will end at the current billing period.",
      });
      refetch();
      queryClient.invalidateQueries({ queryKey: ['/api/subscription-status'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Resume subscription mutation
  const resumeSubscriptionMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/resume-subscription"),
    onSuccess: () => {
      toast({
        title: "Subscription Resumed",
        description: "Your Pro subscription is now active again.",
      });
      refetch();
      queryClient.invalidateQueries({ queryKey: ['/api/subscription-status'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to resume subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleUpgradeClick = () => {
    createSubscriptionMutation.mutate();
  };

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    setClientSecret("");
    refetch();
    queryClient.invalidateQueries({ queryKey: ['/api/subscription-status'] });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  if (statusLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="ml-2">Loading subscription status...</span>
        </CardContent>
      </Card>
    );
  }

  const isPro = subscriptionData?.isPro || false;
  const subscription = subscriptionData?.subscription;

  return (
    <div className="space-y-6">
      {/* Current Plan Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isPro ? (
              <>
                <Crown className="w-5 h-5 text-yellow-500" />
                Pro Plan
              </>
            ) : (
              <>
                <Shield className="w-5 h-5 text-slate-500" />
                Free Plan
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Current Status</span>
              <Badge variant={isPro ? "default" : "secondary"}>
                {isPro ? "Pro Active" : "Free"}
              </Badge>
            </div>
            
            {subscription && (
              <>
                <div className="flex items-center justify-between">
                  <span>Next Billing</span>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(subscription.current_period_end)}
                  </span>
                </div>
                
                {subscription.cancel_at_period_end && (
                  <div className="flex items-center justify-between">
                    <span>Cancellation</span>
                    <Badge variant="outline" className="text-orange-600">
                      Ends {formatDate(subscription.current_period_end)}
                    </Badge>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>



      {/* Payment Form */}
      {showPaymentForm && clientSecret && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Complete Your Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <SubscriptionForm onSuccess={handlePaymentSuccess} />
            </Elements>
          </CardContent>
        </Card>
      )}

      {/* Manage Pro Subscription */}
      {isPro && subscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Manage Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Your Pro subscription gives you access to all premium features.
            </div>
            
            <div className="flex gap-2">
              {subscription.cancel_at_period_end ? (
                <Button 
                  onClick={() => resumeSubscriptionMutation.mutate()}
                  disabled={resumeSubscriptionMutation.isPending}
                  variant="default"
                >
                  {resumeSubscriptionMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Resuming...
                    </>
                  ) : (
                    "Resume Subscription"
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={() => cancelSubscriptionMutation.mutate()}
                  disabled={cancelSubscriptionMutation.isPending}
                  variant="outline"
                >
                  {cancelSubscriptionMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    "Cancel Subscription"
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}