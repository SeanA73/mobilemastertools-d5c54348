import { useState, useEffect } from 'react';
import AdSenseBanner from './AdSenseBanner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, DollarSign } from 'lucide-react';

interface SmartAdPlacementProps {
  placement: 'landing' | 'tools' | 'results' | 'sidebar';
  adSlot: string;
  className?: string;
  onAdShown?: () => void;
}

export default function SmartAdPlacement({ 
  placement, 
  adSlot, 
  className = '',
  onAdShown 
}: SmartAdPlacementProps) {
  const [shouldShowAd, setShouldShowAd] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [adConfig, setAdConfig] = useState<any>(null);

  useEffect(() => {
    // Load ad configuration
    const config = localStorage.getItem('adConfig');
    if (config) {
      const parsed = JSON.parse(config);
      setAdConfig(parsed);
      
      // Check if ads are enabled and this placement is allowed
      if (parsed.enabled && parsed.placements[placement]) {
        checkAdFrequency();
      }
    }
  }, [placement]);

  useEffect(() => {
    if (shouldShowAd && onAdShown) {
      onAdShown();
    }
  }, [shouldShowAd, onAdShown]);

  const checkAdFrequency = () => {
    // Get interaction count for this placement
    const key = `adInteractions_${placement}`;
    const interactions = parseInt(localStorage.getItem(key) || '0');
    const frequency = adConfig?.frequency || 3;
    
    // Show ad if we've reached the frequency threshold
    if (interactions > 0 && interactions % frequency === 0) {
      setShouldShowAd(true);
    }
  };

  const recordInteraction = () => {
    const key = `adInteractions_${placement}`;
    const interactions = parseInt(localStorage.getItem(key) || '0');
    localStorage.setItem(key, (interactions + 1).toString());
    
    // Check if we should show an ad after this interaction
    setTimeout(checkAdFrequency, 1000);
  };

  const dismissAd = () => {
    setIsDismissed(true);
    setShouldShowAd(false);
  };

  const handleAdClick = () => {
    // Record ad click
    const stats = JSON.parse(localStorage.getItem('adStats') || '{"impressions": 0, "clicks": 0, "revenue": 0}');
    stats.clicks += 1;
    localStorage.setItem('adStats', JSON.stringify(stats));
  };

  // Don't show ad if disabled, dismissed, or not ready
  if (!adConfig?.enabled || !adConfig?.placements[placement] || isDismissed || !shouldShowAd) {
    return null;
  }

  const getAdDimensions = () => {
    switch (placement) {
      case 'landing':
        return { format: 'horizontal', height: '90px' };
      case 'sidebar':
        return { format: 'vertical', height: '250px' };
      case 'tools':
        return { format: 'rectangle', height: '250px' };
      case 'results':
        return { format: 'auto', height: '90px' };
      default:
        return { format: 'auto', height: '90px' };
    }
  };

  const dimensions = getAdDimensions();

  return (
    <Card className={`ad-placement ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <DollarSign className="w-3 h-3" />
            <span>Advertisement</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={dismissAd}
            className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
        
        <div onClick={handleAdClick}>
          <AdSenseBanner
            adSlot={adSlot}
            adFormat={dimensions.format as any}
            adStyle={{ height: dimensions.height }}
            className="rounded-lg overflow-hidden"
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Hook to record tool interactions
export const useAdInteraction = (placement: string) => {
  const recordInteraction = () => {
    const key = `adInteractions_${placement}`;
    const interactions = parseInt(localStorage.getItem(key) || '0');
    localStorage.setItem(key, (interactions + 1).toString());
  };

  return { recordInteraction };
};
