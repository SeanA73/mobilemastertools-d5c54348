import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Coffee, Heart } from "lucide-react";

const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

const CheckoutForm = () => {
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
        return_url: window.location.origin + "/support-success",
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Thank You!",
        description: "Your support helps keep this project going!",
      });
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full bg-orange-600 hover:bg-orange-700" 
        disabled={!stripe || isLoading}
      >
        {isLoading ? "Processing..." : "Complete Support Payment"}
      </Button>
    </form>
  );
};

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Get client secret from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const secret = urlParams.get('client_secret');
    
    console.log("Checkout page received client_secret:", secret);
    
    if (secret) {
      // Validate that the client secret has the correct format
      if (secret.startsWith('pi_') && secret.includes('_secret_')) {
        setClientSecret(secret);
      } else {
        console.error("Invalid client secret format:", secret);
        toast({
          title: "Invalid Payment Link",
          description: "The payment link format is invalid.",
          variant: "destructive"
        });
        setLocation('/pricing');
      }
    } else {
      toast({
        title: "Invalid Payment Link",
        description: "This payment link is invalid or expired.",
        variant: "destructive"
      });
      setLocation('/pricing');
    }
  }, [toast, setLocation]);

  if (!stripePromise) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Demo Mode</h1>
              <p className="text-slate-600 mb-4">
                Payments are not available in demo mode. Please configure Stripe keys to enable payments.
              </p>
              <Button asChild>
                <Link href="/app">Continue to App</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/app">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to App
            </Link>
          </Button>
          
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <Coffee className="w-8 h-8 text-orange-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Support Development
            </h1>
            <p className="text-slate-600">
              Your support helps keep this project alive and growing. Thank you!
            </p>
          </div>
        </div>

        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-orange-600" />
              Complete Your Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm />
            </Elements>
          </CardContent>
        </Card>

        {/* Support Info */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="p-6 text-center">
            <h3 className="font-semibold mb-2">Your Support Makes a Difference</h3>
            <p className="text-sm text-gray-600 mb-4">
              As an independent developer, your contribution helps me:
            </p>
            <ul className="text-sm space-y-1 text-left max-w-md mx-auto">
              <li>• Dedicate more time to building new features</li>
              <li>• Cover server costs and development tools</li>
              <li>• Create more useful productivity apps</li>
              <li>• Provide better support and faster updates</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}