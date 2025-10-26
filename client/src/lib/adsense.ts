// AdSense configuration and utilities
export const ADSENSE_CONFIG = {
  clientId: import.meta.env.VITE_ADSENSE_CLIENT_ID || 'ca-pub-1234567890123456',
  adSlots: {
    landing: '1234567890',
    tools: '0987654321',
    results: '1122334455',
    sidebar: '5566778899',
    footer: '9988776655'
  }
};

export const loadAdSenseScript = () => {
  return new Promise<void>((resolve, reject) => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      reject(new Error('AdSense can only be loaded in browser environment'));
      return;
    }

    // Check if script is already loaded
    if (document.querySelector('script[src*="adsbygoogle.js"]')) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CONFIG.clientId}`;
    script.crossOrigin = 'anonymous';
    
    script.onload = () => {
      console.log('AdSense script loaded successfully');
      resolve();
    };
    
    script.onerror = () => {
      console.error('Failed to load AdSense script');
      reject(new Error('AdSense script failed to load'));
    };

    document.head.appendChild(script);
  });
};

export const initializeAdSense = async () => {
  try {
    await loadAdSenseScript();
    
    // Initialize adsbygoogle array if it doesn't exist
    if (!window.adsbygoogle) {
      window.adsbygoogle = [];
    }
    
    console.log('AdSense initialized successfully');
    return true;
  } catch (error) {
    console.error('AdSense initialization failed:', error);
    return false;
  }
};

export const getAdSlot = (placement: keyof typeof ADSENSE_CONFIG.adSlots): string => {
  return ADSENSE_CONFIG.adSlots[placement];
};

export const isAdSenseEnabled = (): boolean => {
  const config = localStorage.getItem('adConfig');
  if (!config) return true; // Default to enabled
  
  const parsed = JSON.parse(config);
  return parsed.enabled;
};

export const recordAdImpression = (placement: string) => {
  const stats = JSON.parse(localStorage.getItem('adStats') || '{"impressions": 0, "clicks": 0, "revenue": 0}');
  stats.impressions += 1;
  localStorage.setItem('adStats', JSON.stringify(stats));
};

export const recordAdClick = (placement: string) => {
  const stats = JSON.parse(localStorage.getItem('adStats') || '{"impressions": 0, "clicks": 0, "revenue": 0}');
  stats.clicks += 1;
  // Simulate revenue calculation (in real implementation, this would come from AdSense API)
  stats.revenue += 0.01;
  localStorage.setItem('adStats', JSON.stringify(stats));
};

// Extend Window interface for AdSense
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}
