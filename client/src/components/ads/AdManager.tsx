import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Eye, EyeOff, DollarSign } from 'lucide-react';

interface AdConfig {
  enabled: boolean;
  frequency: number; // Show ad every N tool interactions
  placements: {
    landing: boolean;
    tools: boolean;
    results: boolean;
    sidebar: boolean;
  };
  types: {
    banner: boolean;
    inline: boolean;
    sidebar: boolean;
  };
}

interface AdManagerProps {
  onConfigChange?: (config: AdConfig) => void;
}

export default function AdManager({ onConfigChange }: AdManagerProps) {
  const [config, setConfig] = useState<AdConfig>(() => {
    const saved = localStorage.getItem('adConfig');
    return saved ? JSON.parse(saved) : {
      enabled: true,
      frequency: 3,
      placements: {
        landing: true,
        tools: true,
        results: true,
        sidebar: false
      },
      types: {
        banner: true,
        inline: true,
        sidebar: false
      }
    };
  });

  const [stats, setStats] = useState({
    impressions: 0,
    clicks: 0,
    revenue: 0
  });

  useEffect(() => {
    // Load stats from localStorage
    const savedStats = localStorage.getItem('adStats');
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('adConfig', JSON.stringify(config));
    onConfigChange?.(config);
  }, [config, onConfigChange]);

  const updateConfig = (updates: Partial<AdConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const toggleAdType = (type: keyof AdConfig['types']) => {
    updateConfig({
      types: {
        ...config.types,
        [type]: !config.types[type]
      }
    });
  };

  const togglePlacement = (placement: keyof AdConfig['placements']) => {
    updateConfig({
      placements: {
        ...config.placements,
        [placement]: !config.placements[placement]
      }
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold">Ad Management</h3>
          </div>
          <Badge variant={config.enabled ? "default" : "secondary"}>
            {config.enabled ? "Enabled" : "Disabled"}
          </Badge>
        </div>

        {/* Ad Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-slate-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.impressions}</div>
            <div className="text-sm text-slate-600">Impressions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.clicks}</div>
            <div className="text-sm text-slate-600">Clicks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">${stats.revenue.toFixed(2)}</div>
            <div className="text-sm text-slate-600">Revenue</div>
          </div>
        </div>

        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="font-medium">Enable AdSense</h4>
            <p className="text-sm text-slate-600">Show ads to generate revenue</p>
          </div>
          <button
            onClick={() => updateConfig({ enabled: !config.enabled })}
            className={`w-12 h-6 rounded-full transition-colors ${
              config.enabled ? 'bg-blue-600' : 'bg-slate-300'
            }`}
            title={config.enabled ? "Disable ads" : "Enable ads"}
            aria-label={config.enabled ? "Disable ads" : "Enable ads"}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                config.enabled ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* Ad Types */}
        <div className="mb-6">
          <h4 className="font-medium mb-3">Ad Types</h4>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(config.types).map(([type, enabled]) => (
              <button
                key={type}
                onClick={() => toggleAdType(type as keyof AdConfig['types'])}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  enabled
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  <span className="capitalize">{type}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Placements */}
        <div className="mb-6">
          <h4 className="font-medium mb-3">Ad Placements</h4>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(config.placements).map(([placement, enabled]) => (
              <button
                key={placement}
                onClick={() => togglePlacement(placement as keyof AdConfig['placements'])}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  enabled
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  <span className="capitalize">{placement}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Frequency Setting */}
        <div className="mb-6">
          <h4 className="font-medium mb-3">Ad Frequency</h4>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-600">Show ad every</span>
            <select
              value={config.frequency}
              onChange={(e) => updateConfig({ frequency: parseInt(e.target.value) })}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Select ad frequency"
              aria-label="Select ad frequency"
            >
              <option value={1}>1 interaction</option>
              <option value={2}>2 interactions</option>
              <option value={3}>3 interactions</option>
              <option value={5}>5 interactions</option>
              <option value={10}>10 interactions</option>
            </select>
            <span className="text-sm text-slate-600">tool uses</span>
          </div>
        </div>

        <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
          <strong>Note:</strong> AdSense integration helps support MobileToolsBox development. 
          Ads are carefully placed to minimize disruption to your workflow.
        </div>
      </CardContent>
    </Card>
  );
}
