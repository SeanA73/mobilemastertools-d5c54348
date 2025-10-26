import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Info, X } from "lucide-react";
import { useState } from "react";

export default function DemoModeBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const isStripeConfigured = !!import.meta.env.VITE_STRIPE_PUBLIC_KEY;

  if (isStripeConfigured || !isVisible) {
    return null;
  }

  return (
    <Alert className="mb-4 border-amber-200 bg-amber-50">
      <Info className="h-4 w-4 text-amber-600" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-amber-800">
          <strong>Demo Mode:</strong> Stripe payments are not configured. Premium features are available for preview only.
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
          className="h-auto p-1 text-amber-600 hover:text-amber-800"
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  );
}