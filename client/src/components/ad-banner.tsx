import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import DonationModal from "@/components/donation-modal";

interface AdBannerProps {
  placement: "header" | "sidebar" | "footer" | "interstitial";
  onAdView?: () => void;
}

const AD_CONTENT = {
  header: {
    title: "Support MobileToolsBox Development",
    message: "Help us build more amazing productivity tools",
    cta: "Buy me a coffee ☕",
    amount: "$3"
  },
  sidebar: {
    title: "Love this app?",
    message: "Support the developer who made this free for everyone",
    cta: "Buy me a coffee ☕",
    amount: "$3"
  },
  footer: {
    title: "Made with ❤️ by an indie developer",
    message: "Your support helps create more useful tools",
    cta: "Support Development",
    amount: "Any amount"
  },
  interstitial: {
    title: "Enjoying MobileToolsBox?",
    message: "Consider supporting development to help us add more features and keep the app running",
    cta: "Support Now",
    amount: "Starting at $3"
  }
};

export default function AdBanner({ placement, onAdView }: AdBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [hasViewed, setHasViewed] = useState(false);
  const content = AD_CONTENT[placement];

  useEffect(() => {
    if (isVisible && !hasViewed) {
      // Track ad view after 2 seconds of visibility
      const timer = setTimeout(() => {
        trackAdView();
        setHasViewed(true);
        onAdView?.();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, hasViewed, onAdView]);

  const trackAdView = async () => {
    try {
      await apiRequest("POST", "/api/track-revenue", {
        eventType: "ad_view",
        amount: 0,
        metadata: { placement, adType: "support_banner" }
      });
    } catch (error) {
      console.error("Failed to track ad view:", error);
    }
  };

  const handleSupportClick = () => {
    setShowDonationModal(true);
  };

  if (!isVisible) return null;

  return (
    <div className={`
      relative bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 
      border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4
      ${placement === "interstitial" ? "fixed inset-x-4 top-20 z-50 max-w-md mx-auto" : ""}
    `}>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-6 w-6 p-0"
        onClick={() => setIsVisible(false)}
      >
        <X className="h-4 w-4" />
      </Button>

      <div className="pr-8">
        <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-100">
          {content.title}
        </h3>
        <p className="text-xs text-blue-700 dark:text-blue-200 mt-1">
          {content.message}
        </p>
        <Button
          onClick={handleSupportClick}
          size="sm"
          className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          {content.cta} ({content.amount})
        </Button>
      </div>

      <DonationModal 
        isOpen={showDonationModal} 
        onClose={() => setShowDonationModal(false)} 
      />
    </div>
  );
}