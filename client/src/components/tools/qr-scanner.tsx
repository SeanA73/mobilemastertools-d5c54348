import { useState, useRef, useEffect } from "react";
import QrScanner from 'qr-scanner';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { 
  QrCode, Camera, Upload, Download, Copy, ExternalLink, 
  Wifi, Phone, Mail, MessageSquare, Calendar, MapPin,
  User, Sparkles, Palette, Settings, History, Trash2,
  Save, Search, Filter, FileText, Link2, CreditCard,
  Globe, Instagram, Twitter, Facebook, Youtube,
  Linkedin, Github, Share2, Image as ImageIcon,
  CheckCircle2, AlertCircle, Zap, TrendingUp, BarChart3
} from "lucide-react";

type QRCodeType = 
  | "url" | "text" | "email" | "phone" | "sms" | "wifi" 
  | "vcard" | "event" | "location" | "social" | "payment";

interface ScanHistoryEntry {
  id: string;
  data: string;
  type: QRCodeType;
  timestamp: Date;
  label?: string;
}

interface QRSettings {
  size: number;
  errorCorrection: "L" | "M" | "Q" | "H";
  foregroundColor: string;
  backgroundColor: string;
  margin: number;
  format: "png" | "svg";
}

const socialPlatforms = [
  { value: "instagram", label: "Instagram", icon: Instagram, placeholder: "@username" },
  { value: "twitter", label: "Twitter", icon: Twitter, placeholder: "@username" },
  { value: "facebook", label: "Facebook", icon: Facebook, placeholder: "facebook.com/username" },
  { value: "youtube", label: "YouTube", icon: Youtube, placeholder: "youtube.com/@channel" },
  { value: "linkedin", label: "LinkedIn", icon: Linkedin, placeholder: "linkedin.com/in/username" },
  { value: "github", label: "GitHub", icon: Github, placeholder: "github.com/username" },
];

const qrTemplates = [
  { id: "url", name: "Website URL", icon: Globe, description: "Link to any website" },
  { id: "email", name: "Email", icon: Mail, description: "Email address with subject" },
  { id: "phone", name: "Phone", icon: Phone, description: "Phone number" },
  { id: "sms", name: "SMS", icon: MessageSquare, description: "Text message" },
  { id: "wifi", name: "WiFi", icon: Wifi, description: "WiFi network credentials" },
  { id: "vcard", name: "Contact Card", icon: User, description: "vCard contact info" },
  { id: "event", name: "Calendar Event", icon: Calendar, description: "Add to calendar" },
  { id: "location", name: "Location", icon: MapPin, description: "GPS coordinates" },
  { id: "social", name: "Social Media", icon: Share2, description: "Social profiles" },
  { id: "text", name: "Plain Text", icon: FileText, description: "Any text content" },
];

export default function QRScannerTool() {
  const [activeTab, setActiveTab] = useState<"scan" | "generate" | "history" | "batch">("scan");
  const [scannedData, setScannedData] = useState("");
  const [selectedType, setSelectedType] = useState<QRCodeType>("url");
  const [generateData, setGenerateData] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [history, setHistory] = useState<ScanHistoryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  
  // QR Settings
  const [settings, setSettings] = useState<QRSettings>({
    size: 400,
    errorCorrection: "M",
    foregroundColor: "#000000",
    backgroundColor: "#FFFFFF",
    margin: 4,
    format: "png",
  });

  // Template-specific states
  const [wifiForm, setWifiForm] = useState({
    ssid: "",
    password: "",
    security: "WPA",
    hidden: false,
  });

  const [vcardForm, setVcardForm] = useState({
    firstName: "",
    lastName: "",
    organization: "",
    title: "",
    phone: "",
    email: "",
    website: "",
    address: "",
  });

  const [eventForm, setEventForm] = useState({
    title: "",
    location: "",
    startDate: "",
    endDate: "",
    description: "",
  });

  const [locationForm, setLocationForm] = useState({
    latitude: "",
    longitude: "",
    label: "",
  });

  const [socialForm, setSocialForm] = useState({
    platform: "instagram",
    username: "",
  });

  const [emailForm, setEmailForm] = useState({
    to: "",
    subject: "",
    body: "",
  });

  const [smsForm, setSmsForm] = useState({
    number: "",
    message: "",
  });

  // Batch generation
  const [batchList, setBatchList] = useState<string[]>([]);
  const [batchInput, setBatchInput] = useState("");
  const [generatedBatch, setGeneratedBatch] = useState<string[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const { toast } = useToast();

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem("qrScanHistory");
    if (savedHistory) {
      const parsed = JSON.parse(savedHistory);
      setHistory(parsed.map((h: any) => ({ ...h, timestamp: new Date(h.timestamp) })));
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem("qrScanHistory", JSON.stringify(history));
    }
  }, [history]);

  const detectQRType = (data: string): QRCodeType => {
    if (data.startsWith("http://") || data.startsWith("https://")) return "url";
    if (data.startsWith("mailto:")) return "email";
    if (data.startsWith("tel:")) return "phone";
    if (data.startsWith("sms:") || data.startsWith("SMSTO:")) return "sms";
    if (data.startsWith("WIFI:")) return "wifi";
    if (data.startsWith("BEGIN:VCARD")) return "vcard";
    if (data.startsWith("BEGIN:VEVENT")) return "event";
    if (data.startsWith("geo:")) return "location";
    return "text";
  };

  const startCamera = async () => {
    try {
      if (videoRef.current && !qrScannerRef.current) {
        qrScannerRef.current = new QrScanner(
          videoRef.current,
          (result) => handleQRDetection(result.data),
          {
            preferredCamera: 'environment',
            highlightScanRegion: true,
            highlightCodeOutline: true,
          }
        );
      }
      
      if (qrScannerRef.current) {
        await qrScannerRef.current.start();
        setIsScanning(true);
        toast({
          title: "Camera Started",
          description: "Point your camera at a QR code to scan",
        });
      }
    } catch (error) {
      console.error('Camera error:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const result = await QrScanner.scanImage(file, {
          returnDetailedScanResult: true,
        });
        handleQRDetection(result.data);
        toast({
          title: "QR Code Found",
          description: "Successfully scanned QR code from image",
        });
      } catch (error) {
        toast({
          title: "No QR Code Found",
          description: "Could not detect a QR code in the uploaded image",
          variant: "destructive",
        });
      }
    }
  };

  const handleQRDetection = (data: string) => {
    setScannedData(data);
    const type = detectQRType(data);
    
    const newEntry: ScanHistoryEntry = {
      id: Date.now().toString(),
      data,
      type,
      timestamp: new Date()
    };
    setHistory(prev => [newEntry, ...prev].slice(0, 50));
    
    toast({
      title: "QR Code Detected",
      description: `${type.toUpperCase()}: ${data.substring(0, 50)}${data.length > 50 ? "..." : ""}`,
    });
  };

  const buildQRData = (): string => {
    switch (selectedType) {
      case "wifi":
        return `WIFI:T:${wifiForm.security};S:${wifiForm.ssid};P:${wifiForm.password};H:${wifiForm.hidden};`;
      
      case "vcard":
        return `BEGIN:VCARD
VERSION:3.0
N:${vcardForm.lastName};${vcardForm.firstName}
FN:${vcardForm.firstName} ${vcardForm.lastName}
ORG:${vcardForm.organization}
TITLE:${vcardForm.title}
TEL:${vcardForm.phone}
EMAIL:${vcardForm.email}
URL:${vcardForm.website}
ADR:;;${vcardForm.address};;;;
END:VCARD`;
      
      case "event":
        return `BEGIN:VEVENT
SUMMARY:${eventForm.title}
LOCATION:${eventForm.location}
DTSTART:${eventForm.startDate.replace(/[-:]/g, "")}
DTEND:${eventForm.endDate.replace(/[-:]/g, "")}
DESCRIPTION:${eventForm.description}
END:VEVENT`;
      
      case "location":
        return `geo:${locationForm.latitude},${locationForm.longitude}${locationForm.label ? `?q=${encodeURIComponent(locationForm.label)}` : ""}`;
      
      case "social":
        const platform = socialPlatforms.find(p => p.value === socialForm.platform);
        if (platform?.value === "instagram") {
          return `https://instagram.com/${socialForm.username.replace("@", "")}`;
        } else if (platform?.value === "twitter") {
          return `https://twitter.com/${socialForm.username.replace("@", "")}`;
        } else {
          return socialForm.username;
        }
      
      case "email":
        return `mailto:${emailForm.to}?subject=${encodeURIComponent(emailForm.subject)}&body=${encodeURIComponent(emailForm.body)}`;
      
      case "sms":
        return `sms:${smsForm.number}${smsForm.message ? `?body=${encodeURIComponent(smsForm.message)}` : ""}`;
      
      case "phone":
        return `tel:${generateData}`;
      
      case "url":
        return generateData.startsWith("http") ? generateData : `https://${generateData}`;
      
      default:
        return generateData;
    }
  };

  const generateQRCode = () => {
    const data = buildQRData();
    
    if (!data.trim()) {
      toast({
        title: "Error",
        description: "Please enter data to generate QR code",
        variant: "destructive",
      });
      return;
    }

    try {
      const encodedData = encodeURIComponent(data);
      const { size, errorCorrection, foregroundColor, backgroundColor, margin } = settings;
      
      const fg = foregroundColor.replace("#", "");
      const bg = backgroundColor.replace("#", "");
      
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}&ecc=${errorCorrection}&color=${fg}&bgcolor=${bg}&margin=${margin}`;
      setQrCodeUrl(qrUrl);
      
      toast({
        title: "QR Code Generated",
        description: "QR code created successfully",
      });
    } catch (error) {
      toast({
        title: "Generation Error",
        description: "Failed to generate QR code",
        variant: "destructive",
      });
    }
  };

  const generateBatchQRCodes = () => {
    if (batchList.length === 0) {
      toast({
        title: "No Data",
        description: "Add items to the batch list first",
        variant: "destructive",
      });
      return;
    }

    const urls = batchList.map(item => {
      const encodedData = encodeURIComponent(item);
      const { size, errorCorrection, foregroundColor, backgroundColor, margin } = settings;
      const fg = foregroundColor.replace("#", "");
      const bg = backgroundColor.replace("#", "");
      return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}&ecc=${errorCorrection}&color=${fg}&bgcolor=${bg}&margin=${margin}`;
    });

    setGeneratedBatch(urls);
    toast({
      title: "Batch Generated",
      description: `Generated ${urls.length} QR codes`,
    });
  };

  const addToBatch = () => {
    if (batchInput.trim()) {
      setBatchList(prev => [...prev, batchInput.trim()]);
      setBatchInput("");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Content copied to clipboard",
    });
  };

  const openLink = (url: string) => {
    window.open(url, "_blank");
  };

  const downloadQR = (url: string, filename: string = "qrcode") => {
    fetch(url)
      .then(res => res.blob())
      .then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}.png`;
        link.click();
      });
  };

  const exportHistory = () => {
    const data = JSON.stringify(history, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qr-history-${Date.now()}.json`;
    link.click();
    toast({ title: "History Exported", description: "Download started" });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("qrScanHistory");
    toast({ title: "History Cleared" });
  };

  const filteredHistory = history.filter(entry => {
    const matchesSearch = entry.data.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || entry.type === filterType;
    return matchesSearch && matchesType;
  });

  const formatData = (data: string, type: QRCodeType) => {
    switch (type) {
      case "wifi":
        const wifiMatch = data.match(/WIFI:T:(.*?);S:(.*?);P:(.*?);H:(.*?);?/);
        if (wifiMatch) {
          return `Network: ${wifiMatch[2]}\nSecurity: ${wifiMatch[1]}\nPassword: ${wifiMatch[3]}`;
        }
        break;
      case "vcard":
        return data.replace(/;/g, "\n").replace(/BEGIN:VCARD|END:VCARD|VERSION:.*?\n/g, "");
      default:
        return data;
    }
    return data;
  };

  const getIcon = (type: QRCodeType) => {
    switch (type) {
      case "url": return Globe;
      case "email": return Mail;
      case "phone": return Phone;
      case "sms": return MessageSquare;
      case "wifi": return Wifi;
      case "event": return Calendar;
      case "location": return MapPin;
      case "vcard": return User;
      case "social": return Share2;
      default: return FileText;
    }
  };

  const getStats = () => {
    const totalScans = history.length;
    const types = history.reduce((acc, entry) => {
      acc[entry.type] = (acc[entry.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const mostCommon = Object.entries(types).sort((a, b) => b[1] - a[1])[0];
    
    return { totalScans, types, mostCommon };
  };

  useEffect(() => {
    QrScanner.hasCamera().then(hasCamera => {
      if (!hasCamera) {
        toast({
          title: "No Camera",
          description: "No camera found on this device",
          variant: "destructive",
        });
      }
    });

    return () => {
      stopCamera();
    };
  }, []);

  const stats = getStats();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <QrCode className="w-8 h-8 text-blue-500" />
            Advanced QR Code Manager
          </h2>
          <p className="text-slate-600 mt-1">
            Scan, generate, and manage QR codes with advanced features
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Scans</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalScans}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Most Common</p>
                <p className="text-2xl font-bold text-slate-900 capitalize">
                  {stats.mostCommon?.[0] || "None"}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Unique Types</p>
                <p className="text-2xl font-bold text-slate-900">
                  {Object.keys(stats.types).length}
                </p>
              </div>
              <Zap className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="scan">
            <Camera className="w-4 h-4 mr-2" />
            Scan
          </TabsTrigger>
          <TabsTrigger value="generate">
            <Sparkles className="w-4 h-4 mr-2" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="batch">
            <QrCode className="w-4 h-4 mr-2" />
            Batch
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="w-4 h-4 mr-2" />
            History ({history.length})
          </TabsTrigger>
        </TabsList>

        {/* Scan Tab */}
        <TabsContent value="scan" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>QR Code Scanner</CardTitle>
                <CardDescription>Scan QR codes using camera or upload image</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden relative">
                  {isScanning ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <Camera className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                        <p className="text-slate-500">Camera preview will appear here</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  {!isScanning ? (
                    <Button onClick={startCamera} className="w-full">
                      <Camera className="w-4 h-4 mr-2" />
                      Start Camera
                    </Button>
                  ) : (
                    <Button onClick={stopCamera} variant="outline" className="w-full">
                      Stop Camera
                    </Button>
                  )}
                  
                  <div className="relative">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="qr-upload"
                    />
                    <Label htmlFor="qr-upload" className="cursor-pointer">
                      <Button variant="outline" className="w-full" asChild>
                        <span>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Image
                        </span>
                      </Button>
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Scan Results</CardTitle>
                <CardDescription>Latest scanned QR code data</CardDescription>
              </CardHeader>
              <CardContent>
                {scannedData ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          {(() => {
                            const Icon = getIcon(detectQRType(scannedData));
                            return <Icon className="w-3 h-3" />;
                          })()}
                          {detectQRType(scannedData).toUpperCase()}
                        </Badge>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(scannedData)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          {detectQRType(scannedData) === "url" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openLink(scannedData)}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <ScrollArea className="h-[300px]">
                        <pre className="text-sm whitespace-pre-wrap break-all">
                          {formatData(scannedData, detectQRType(scannedData))}
                        </pre>
                      </ScrollArea>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <QrCode className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Scan a QR code to see results here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Generate Tab */}
        <TabsContent value="generate" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Templates */}
            <Card>
              <CardHeader>
                <CardTitle>Templates</CardTitle>
                <CardDescription>Choose a QR code type</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-2">
                    {qrTemplates.map((template) => {
                      const Icon = template.icon;
                      return (
                        <button
                          key={template.id}
                          onClick={() => setSelectedType(template.id as QRCodeType)}
                          className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                            selectedType === template.id
                              ? "border-primary bg-primary/5"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Icon className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm text-slate-900">
                                {template.name}
                              </div>
                              <div className="text-xs text-slate-500">
                                {template.description}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Form */}
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
                <CardDescription>Enter your information</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {selectedType === "url" && (
                      <div className="space-y-2">
                        <Label>Website URL</Label>
                        <Input
                          placeholder="https://example.com"
                          value={generateData}
                          onChange={(e) => setGenerateData(e.target.value)}
                        />
                      </div>
                    )}

                    {selectedType === "text" && (
                      <div className="space-y-2">
                        <Label>Text Content</Label>
                        <Textarea
                          placeholder="Enter any text..."
                          value={generateData}
                          onChange={(e) => setGenerateData(e.target.value)}
                          rows={8}
                        />
                      </div>
                    )}

                    {selectedType === "wifi" && (
                      <>
                        <div className="space-y-2">
                          <Label>Network Name (SSID)</Label>
                          <Input
                            placeholder="MyWiFi"
                            value={wifiForm.ssid}
                            onChange={(e) => setWifiForm({ ...wifiForm, ssid: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Password</Label>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            value={wifiForm.password}
                            onChange={(e) => setWifiForm({ ...wifiForm, password: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Security Type</Label>
                          <Select
                            value={wifiForm.security}
                            onValueChange={(v) => setWifiForm({ ...wifiForm, security: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="WPA">WPA/WPA2</SelectItem>
                              <SelectItem value="WEP">WEP</SelectItem>
                              <SelectItem value="nopass">Open Network</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}

                    {selectedType === "vcard" && (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-2">
                            <Label>First Name</Label>
                            <Input
                              value={vcardForm.firstName}
                              onChange={(e) => setVcardForm({ ...vcardForm, firstName: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Last Name</Label>
                            <Input
                              value={vcardForm.lastName}
                              onChange={(e) => setVcardForm({ ...vcardForm, lastName: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Organization</Label>
                          <Input
                            value={vcardForm.organization}
                            onChange={(e) => setVcardForm({ ...vcardForm, organization: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Job Title</Label>
                          <Input
                            value={vcardForm.title}
                            onChange={(e) => setVcardForm({ ...vcardForm, title: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Phone</Label>
                          <Input
                            type="tel"
                            value={vcardForm.phone}
                            onChange={(e) => setVcardForm({ ...vcardForm, phone: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={vcardForm.email}
                            onChange={(e) => setVcardForm({ ...vcardForm, email: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Website</Label>
                          <Input
                            value={vcardForm.website}
                            onChange={(e) => setVcardForm({ ...vcardForm, website: e.target.value })}
                          />
                        </div>
                      </>
                    )}

                    {selectedType === "email" && (
                      <>
                        <div className="space-y-2">
                          <Label>Email Address</Label>
                          <Input
                            type="email"
                            placeholder="name@example.com"
                            value={emailForm.to}
                            onChange={(e) => setEmailForm({ ...emailForm, to: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Subject</Label>
                          <Input
                            placeholder="Email subject"
                            value={emailForm.subject}
                            onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Message</Label>
                          <Textarea
                            placeholder="Email body..."
                            value={emailForm.body}
                            onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })}
                            rows={4}
                          />
                        </div>
                      </>
                    )}

                    {selectedType === "phone" && (
                      <div className="space-y-2">
                        <Label>Phone Number</Label>
                        <Input
                          type="tel"
                          placeholder="+1234567890"
                          value={generateData}
                          onChange={(e) => setGenerateData(e.target.value)}
                        />
                      </div>
                    )}

                    {selectedType === "sms" && (
                      <>
                        <div className="space-y-2">
                          <Label>Phone Number</Label>
                          <Input
                            type="tel"
                            placeholder="+1234567890"
                            value={smsForm.number}
                            onChange={(e) => setSmsForm({ ...smsForm, number: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Message</Label>
                          <Textarea
                            placeholder="SMS message..."
                            value={smsForm.message}
                            onChange={(e) => setSmsForm({ ...smsForm, message: e.target.value })}
                            rows={4}
                          />
                        </div>
                      </>
                    )}

                    {selectedType === "location" && (
                      <>
                        <div className="space-y-2">
                          <Label>Latitude</Label>
                          <Input
                            placeholder="40.7128"
                            value={locationForm.latitude}
                            onChange={(e) => setLocationForm({ ...locationForm, latitude: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Longitude</Label>
                          <Input
                            placeholder="-74.0060"
                            value={locationForm.longitude}
                            onChange={(e) => setLocationForm({ ...locationForm, longitude: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Label (Optional)</Label>
                          <Input
                            placeholder="Location name"
                            value={locationForm.label}
                            onChange={(e) => setLocationForm({ ...locationForm, label: e.target.value })}
                          />
                        </div>
                      </>
                    )}

                    {selectedType === "social" && (
                      <>
                        <div className="space-y-2">
                          <Label>Platform</Label>
                          <Select
                            value={socialForm.platform}
                            onValueChange={(v) => setSocialForm({ ...socialForm, platform: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {socialPlatforms.map(platform => {
                                const Icon = platform.icon;
                                return (
                                  <SelectItem key={platform.value} value={platform.value}>
                                    <div className="flex items-center gap-2">
                                      <Icon className="w-4 h-4" />
                                      {platform.label}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Username/Profile</Label>
                          <Input
                            placeholder={socialPlatforms.find(p => p.value === socialForm.platform)?.placeholder}
                            value={socialForm.username}
                            onChange={(e) => setSocialForm({ ...socialForm, username: e.target.value })}
                          />
                        </div>
                      </>
                    )}

                    {selectedType === "event" && (
                      <>
                        <div className="space-y-2">
                          <Label>Event Title</Label>
                          <Input
                            value={eventForm.title}
                            onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Location</Label>
                          <Input
                            value={eventForm.location}
                            onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Start Date/Time</Label>
                          <Input
                            type="datetime-local"
                            value={eventForm.startDate}
                            onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>End Date/Time</Label>
                          <Input
                            type="datetime-local"
                            value={eventForm.endDate}
                            onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            value={eventForm.description}
                            onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                            rows={3}
                          />
                        </div>
                      </>
                    )}

                    <Separator />

                    {/* Customization */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        <Label className="text-base font-semibold">Customization</Label>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Size: {settings.size}px</Label>
                        <Slider
                          value={[settings.size]}
                          onValueChange={(v) => setSettings({ ...settings, size: v[0] })}
                          min={200}
                          max={800}
                          step={50}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label>Foreground</Label>
                          <Input
                            type="color"
                            value={settings.foregroundColor}
                            onChange={(e) => setSettings({ ...settings, foregroundColor: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Background</Label>
                          <Input
                            type="color"
                            value={settings.backgroundColor}
                            onChange={(e) => setSettings({ ...settings, backgroundColor: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Error Correction</Label>
                        <Select
                          value={settings.errorCorrection}
                          onValueChange={(v: any) => setSettings({ ...settings, errorCorrection: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="L">Low (7%)</SelectItem>
                            <SelectItem value="M">Medium (15%)</SelectItem>
                            <SelectItem value="Q">Quartile (25%)</SelectItem>
                            <SelectItem value="H">High (30%)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button onClick={generateQRCode} className="w-full">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate QR Code
                    </Button>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>Your generated QR code</CardDescription>
              </CardHeader>
              <CardContent>
                {qrCodeUrl ? (
                  <div className="space-y-4">
                    <div className="flex justify-center p-4 bg-slate-50 rounded-lg">
                      <img 
                        src={qrCodeUrl} 
                        alt="Generated QR Code"
                        className="max-w-full h-auto rounded-lg shadow-lg"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        onClick={() => copyToClipboard(buildQRData())}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Data
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => downloadQR(qrCodeUrl)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>

                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-blue-900">QR Code Ready</p>
                          <p className="text-blue-700">
                            Scan this code to access your {selectedType} data
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <QrCode className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Fill the form and click generate</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Batch Tab */}
        <TabsContent value="batch" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Batch Generation</CardTitle>
                <CardDescription>Generate multiple QR codes at once</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Add Items</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter URL or text..."
                      value={batchInput}
                      onChange={(e) => setBatchInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addToBatch()}
                    />
                    <Button onClick={addToBatch}>
                      Add
                    </Button>
                  </div>
                </div>

                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {batchList.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                        <span className="text-sm truncate flex-1">{item}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setBatchList(prev => prev.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <Button onClick={generateBatchQRCodes} className="w-full" disabled={batchList.length === 0}>
                  <Zap className="w-4 h-4 mr-2" />
                  Generate {batchList.length} QR Codes
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Generated Batch</CardTitle>
                <CardDescription>{generatedBatch.length} QR codes</CardDescription>
              </CardHeader>
              <CardContent>
                {generatedBatch.length > 0 ? (
                  <ScrollArea className="h-[450px]">
                    <div className="grid grid-cols-2 gap-4">
                      {generatedBatch.map((url, idx) => (
                        <div key={idx} className="space-y-2">
                          <img src={url} alt={`QR ${idx + 1}`} className="w-full rounded-lg border" />
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => downloadQR(url, `qr-${idx + 1}`)}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <QrCode className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Add items to batch list and generate</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Scan History</CardTitle>
                  <CardDescription>All your scanned QR codes</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={exportHistory} disabled={history.length === 0}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearHistory} disabled={history.length === 0}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search history..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="url">URL</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="wifi">WiFi</SelectItem>
                    <SelectItem value="vcard">Contact</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="h-[500px]">
                {filteredHistory.length > 0 ? (
                  <div className="space-y-2">
                    {filteredHistory.map((entry) => {
                      const IconComponent = getIcon(entry.type);
                      return (
                        <div key={entry.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <IconComponent className="w-5 h-5 text-slate-600 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-900 truncate">
                                {entry.data.substring(0, 80)}
                                {entry.data.length > 80 ? "..." : ""}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {entry.type.toUpperCase()}
                                </Badge>
                                <span className="text-xs text-slate-500">
                                  {entry.timestamp.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(entry.data)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            {entry.type === "url" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openLink(entry.data)}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>
                      {history.length === 0 
                        ? "No scan history yet"
                        : "No results found"}
                    </p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
