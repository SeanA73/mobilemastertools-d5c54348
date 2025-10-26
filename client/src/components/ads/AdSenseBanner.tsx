import { useEffect, useRef } from 'react';

interface AdSenseBannerProps {
  adSlot: string;
  adFormat?: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
  adStyle?: React.CSSProperties;
  className?: string;
  responsive?: boolean;
}

export default function AdSenseBanner({ 
  adSlot, 
  adFormat = 'auto',
  adStyle = {},
  className = '',
  responsive = true 
}: AdSenseBannerProps) {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.adsbygoogle && adRef.current) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (error) {
        console.log('AdSense error:', error);
      }
    }
  }, [adSlot]);

  return (
    <div className={`ad-container ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{
          display: 'block',
          width: '100%',
          height: adFormat === 'rectangle' ? '250px' : adFormat === 'vertical' ? '600px' : '90px',
          ...adStyle
        }}
        data-ad-client={import.meta.env.VITE_ADSENSE_CLIENT_ID || 'ca-pub-1234567890123456'}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
}

// Extend Window interface for AdSense
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}
