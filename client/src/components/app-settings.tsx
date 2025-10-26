import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Palette, Type, Monitor, Sun, Moon, Zap, RotateCcw,
  Check, Smartphone, Laptop, Settings as SettingsIcon, DollarSign
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdManager from "@/components/ads/AdManager";

interface AppSettings {
  theme: "light" | "dark" | "auto";
  accentColor: string;
  fontSize: "small" | "medium" | "large";
  fontFamily: "sans" | "serif" | "mono";
  compactMode: boolean;
  animations: boolean;
  soundEffects: boolean;
}

interface AppSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const accentColors = [
  { value: "#2563EB", name: "Blue", class: "bg-blue-600" },
  { value: "#7C3AED", name: "Purple", class: "bg-purple-600" },
  { value: "#059669", name: "Green", class: "bg-emerald-600" },
  { value: "#DC2626", name: "Red", class: "bg-red-600" },
  { value: "#EA580C", name: "Orange", class: "bg-orange-600" },
  { value: "#0891B2", name: "Cyan", class: "bg-cyan-600" },
  { value: "#BE185D", name: "Pink", class: "bg-pink-600" },
  { value: "#CA8A04", name: "Yellow", class: "bg-yellow-600" },
];

const fontFamilies = [
  { value: "sans", name: "Sans Serif", example: "font-sans", description: "Clean and modern" },
  { value: "serif", name: "Serif", example: "font-serif", description: "Traditional and elegant" },
  { value: "mono", name: "Monospace", example: "font-mono", description: "Code-like appearance" },
];

export default function AppSettingsDialog({ isOpen, onClose }: AppSettingsDialogProps) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AppSettings>({
    theme: "light",
    accentColor: "#2563EB",
    fontSize: "medium",
    fontFamily: "sans",
    compactMode: false,
    animations: true,
    soundEffects: false,
  });

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("appSettings");
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load settings");
      }
    }
  }, []);

  // Apply settings
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply theme
    if (settings.theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Apply accent color
    root.style.setProperty("--primary", settings.accentColor);
    
    // Apply font size
    const fontSizeMap = { small: "14px", medium: "16px", large: "18px" };
    root.style.fontSize = fontSizeMap[settings.fontSize];
    
    // Apply font family
    const fontMap = {
      sans: "ui-sans-serif, system-ui, sans-serif",
      serif: "ui-serif, Georgia, serif",
      mono: "ui-monospace, monospace"
    };
    root.style.fontFamily = fontMap[settings.fontFamily];
    
    // Apply animations
    if (!settings.animations) {
      root.classList.add("reduce-motion");
    } else {
      root.classList.remove("reduce-motion");
    }

    // Save to localStorage
    localStorage.setItem("appSettings", JSON.stringify(settings));
  }, [settings]);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    const defaultSettings: AppSettings = {
      theme: "light",
      accentColor: "#2563EB",
      fontSize: "medium",
      fontFamily: "sans",
      compactMode: false,
      animations: true,
      soundEffects: false,
    };
    setSettings(defaultSettings);
    toast({
      title: "Settings Reset",
      description: "All settings restored to defaults",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <SettingsIcon className="w-6 h-6" />
            App Settings
          </DialogTitle>
          <DialogDescription>
            Customize your MobileToolsBox experience
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="behavior">Behavior</TabsTrigger>
            <TabsTrigger value="ads">Revenue</TabsTrigger>
          </TabsList>

          <TabsContent value="appearance" className="space-y-6 py-4">
            {/* Appearance */}
            <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-slate-600" />
              <h3 className="text-lg font-semibold">Appearance</h3>
            </div>

            {/* Theme */}
            <div className="space-y-2">
              <Label>Theme</Label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => updateSetting("theme", "light")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    settings.theme === "light"
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <Sun className="w-6 h-6 mx-auto mb-2 text-amber-500" />
                  <p className="text-sm font-medium">Light</p>
                </button>
                <button
                  onClick={() => updateSetting("theme", "dark")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    settings.theme === "dark"
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <Moon className="w-6 h-6 mx-auto mb-2 text-slate-700" />
                  <p className="text-sm font-medium">Dark</p>
                </button>
                <button
                  onClick={() => updateSetting("theme", "auto")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    settings.theme === "auto"
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <Monitor className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-sm font-medium">Auto</p>
                </button>
              </div>
            </div>

            {/* Accent Color */}
            <div className="space-y-2">
              <Label>Accent Color</Label>
              <div className="grid grid-cols-4 gap-3">
                {accentColors.map(color => (
                  <button
                    key={color.value}
                    onClick={() => updateSetting("accentColor", color.value)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      settings.accentColor === color.value
                        ? "border-slate-900 scale-105"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className={`w-full h-8 rounded ${color.class} mb-2`} />
                    <p className="text-xs font-medium">{color.name}</p>
                    {settings.accentColor === color.value && (
                      <Check className="w-4 h-4 mx-auto mt-1 text-green-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* Typography */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Type className="w-5 h-5 text-slate-600" />
              <h3 className="text-lg font-semibold">Typography</h3>
            </div>

            {/* Font Size */}
            <div className="space-y-2">
              <Label>Font Size</Label>
              <div className="grid grid-cols-3 gap-3">
                {["small", "medium", "large"].map(size => (
                  <button
                    key={size}
                    onClick={() => updateSetting("fontSize", size as any)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      settings.fontSize === size
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className={`font-semibold mb-1 ${
                      size === "small" ? "text-sm" :
                      size === "large" ? "text-lg" : "text-base"
                    }`}>
                      Aa
                    </div>
                    <p className="text-xs capitalize">{size}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Family */}
            <div className="space-y-2">
              <Label>Font Family</Label>
              <div className="space-y-2">
                {fontFamilies.map(font => (
                  <button
                    key={font.value}
                    onClick={() => updateSetting("fontFamily", font.value as any)}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                      settings.fontFamily === font.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className={`font-semibold mb-1 ${font.example}`}>
                          {font.name}
                        </p>
                        <p className="text-xs text-slate-600">{font.description}</p>
                      </div>
                      {settings.fontFamily === font.value && (
                        <Check className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* Display Options */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Monitor className="w-5 h-5 text-slate-600" />
              <h3 className="text-lg font-semibold">Display Options</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-slate-600" />
                  <div>
                    <p className="font-medium">Compact Mode</p>
                    <p className="text-sm text-slate-600">Reduce spacing for smaller screens</p>
                  </div>
                </div>
                <Switch
                  checked={settings.compactMode}
                  onCheckedChange={(checked) => updateSetting("compactMode", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-slate-600" />
                  <div>
                    <p className="font-medium">Animations</p>
                    <p className="text-sm text-slate-600">Enable smooth transitions and effects</p>
                  </div>
                </div>
                <Switch
                  checked={settings.animations}
                  onCheckedChange={(checked) => updateSetting("animations", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 012.828 2.828" />
                  </svg>
                  <div>
                    <p className="font-medium">Sound Effects</p>
                    <p className="text-sm text-slate-600">Play sounds for notifications and actions</p>
                  </div>
                </div>
                <Switch
                  checked={settings.soundEffects}
                  onCheckedChange={(checked) => updateSetting("soundEffects", checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Preview */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Laptop className="w-5 h-5 text-slate-600" />
              <h3 className="text-lg font-semibold">Preview</h3>
            </div>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <h4 className="text-xl font-bold" style={{ color: settings.accentColor }}>
                    MobileToolsBox
                  </h4>
                  <p className={`text-sm ${settings.fontSize === "small" ? "text-xs" : settings.fontSize === "large" ? "text-base" : "text-sm"}`}>
                    This is how your app will look with the current settings.
                  </p>
                  <Button style={{ backgroundColor: settings.accentColor }}>
                    Sample Button
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

            {/* Actions */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={resetSettings}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset to Defaults
              </Button>
              <Button onClick={onClose} style={{ backgroundColor: settings.accentColor }}>
                <Check className="w-4 h-4 mr-2" />
                Save & Close
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="behavior" className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-slate-600" />
                <h3 className="text-lg font-semibold">Behavior Settings</h3>
              </div>
              
              {/* Compact Mode */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Compact Mode</Label>
                  <p className="text-sm text-slate-600">Reduce spacing for more content</p>
                </div>
                <Switch
                  checked={settings.compactMode}
                  onCheckedChange={(checked) => updateSetting("compactMode", checked)}
                />
              </div>

              {/* Animations */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Animations</Label>
                  <p className="text-sm text-slate-600">Enable smooth transitions</p>
                </div>
                <Switch
                  checked={settings.animations}
                  onCheckedChange={(checked) => updateSetting("animations", checked)}
                />
              </div>

              {/* Sound Effects */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sound Effects</Label>
                  <p className="text-sm text-slate-600">Play sounds for interactions</p>
                </div>
                <Switch
                  checked={settings.soundEffects}
                  onCheckedChange={(checked) => updateSetting("soundEffects", checked)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ads" className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold">Revenue & Ads</h3>
              </div>
              <AdManager />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

