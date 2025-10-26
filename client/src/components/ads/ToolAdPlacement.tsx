import { useEffect, useState } from 'react';
import { useAdInteraction } from './SmartAdPlacement';
import SmartAdPlacement from './SmartAdPlacement';

interface ToolAdPlacementProps {
  toolId: string;
  className?: string;
}

export default function ToolAdPlacement({ toolId, className = '' }: ToolAdPlacementProps) {
  const [showAd, setShowAd] = useState(false);
  const { recordInteraction } = useAdInteraction('results');

  useEffect(() => {
    // Show ad after a delay to not interrupt immediate results
    const timer = setTimeout(() => {
      setShowAd(true);
      recordInteraction();
    }, 2000);

    return () => clearTimeout(timer);
  }, [recordInteraction]);

  if (!showAd) return null;

  return (
    <div className={`mt-6 ${className}`}>
      <SmartAdPlacement 
        placement="results" 
        adSlot="1122334455"
        className="max-w-2xl mx-auto"
        onAdShown={() => console.log(`Ad shown for tool: ${toolId}`)}
      />
    </div>
  );
}
