import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, Download, FileText, Image, FileAudio, FileVideo, 
  File, Trash2, RefreshCw, CheckCircle, AlertCircle, Settings,
  History, Sparkles, Zap, Layers, Maximize2, Minimize2,
  Eye, Copy, Scissors, Combine, Archive, Info, TrendingUp,
  BarChart3, Clock, HardDrive, Star, Filter, Search, X
} from "lucide-react";

type FileType = "image" | "document" | "audio" | "video" | "archive";
type ConversionStatus = "pending" | "converting" | "completed" | "error";

interface FileItem {
  id: string;
  file: File;
  originalFormat: string;
  targetFormat: string;
  status: ConversionStatus;
  progress: number;
  downloadUrl?: string;
  error?: string;
  previewUrl?: string;
  convertedSize?: number;
}

interface ConversionSettings {
  quality: number;
  imageWidth?: number;
  imageHeight?: number;
  maintainAspectRatio: boolean;
  audioBitrate?: string;
  videoBitrate?: string;
  compression: "none" | "low" | "medium" | "high";
}

interface ConversionPreset {
  id: string;
  name: string;
  description: string;
  settings: Partial<ConversionSettings>;
  targetFormat: string;
  icon: any;
}

const supportedFormats = {
  image: {
    input: ["jpg", "jpeg", "png", "gif", "bmp", "webp", "tiff", "svg", "ico", "heic"],
    output: ["jpg", "png", "webp", "gif", "bmp", "pdf", "ico", "svg"],
    description: "Photos, graphics, and illustrations"
  },
  document: {
    input: ["txt", "md", "html", "csv", "json", "xml", "rtf", "doc", "docx"],
    output: ["txt", "pdf", "html", "md", "docx", "csv", "json"],
    description: "Text files and documents"
  },
  audio: {
    input: ["mp3", "wav", "ogg", "m4a", "flac", "aac", "wma", "aiff"],
    output: ["mp3", "wav", "ogg", "m4a", "aac", "flac"],
    description: "Music and audio files"
  },
  video: {
    input: ["mp4", "avi", "mov", "mkv", "webm", "flv", "wmv", "m4v"],
    output: ["mp4", "webm", "gif", "avi", "mov", "mkv"],
    description: "Video files and animations"
  },
  archive: {
    input: ["zip", "rar", "7z", "tar", "gz", "bz2"],
    output: ["zip", "tar", "gz"],
    description: "Compressed archive files"
  }
};

const conversionPresets: ConversionPreset[] = [
  {
    id: "web-image",
    name: "Web Optimized",
    description: "Compress for web use",
    settings: { quality: 85, compression: "medium" },
    targetFormat: "webp",
    icon: Zap
  },
  {
    id: "high-quality",
    name: "High Quality",
    description: "Maximum quality",
    settings: { quality: 95, compression: "none" },
    targetFormat: "png",
    icon: Star
  },
  {
    id: "thumbnail",
    name: "Thumbnail",
    description: "Small preview image",
    settings: { quality: 75, imageWidth: 200, compression: "high" },
    targetFormat: "jpg",
    icon: Minimize2
  },
  {
    id: "print-ready",
    name: "Print Ready",
    description: "High resolution PDF",
    settings: { quality: 100, compression: "none" },
    targetFormat: "pdf",
    icon: FileText
  },
];

export default function FileConverterTool() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState<"convert" | "compress" | "history" | "tools">("convert");
  const [settings, setSettings] = useState<ConversionSettings>({
    quality: 90,
    maintainAspectRatio: true,
    compression: "medium",
    audioBitrate: "192",
    videoBitrate: "1000",
  });
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [history, setHistory] = useState<FileItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [showSettings, setShowSettings] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const getFileType = (fileName: string): FileType => {
    const ext = fileName.split('.').pop()?.toLowerCase() || "";
    
    if (supportedFormats.image.input.includes(ext)) return "image";
    if (supportedFormats.document.input.includes(ext)) return "document";
    if (supportedFormats.audio.input.includes(ext)) return "audio";
    if (supportedFormats.video.input.includes(ext)) return "video";
    if (supportedFormats.archive.input.includes(ext)) return "archive";
    
    return "document";
  };

  const getFileIcon = (type: FileType) => {
    switch (type) {
      case "image": return Image;
      case "document": return FileText;
      case "audio": return FileAudio;
      case "video": return FileVideo;
      case "archive": return Archive;
      default: return File;
    }
  };

  const handleFiles = (newFiles: FileList) => {
    Array.from(newFiles).forEach(file => {
      const ext = file.name.split('.').pop()?.toLowerCase() || "";
      const fileType = getFileType(file.name);
      
      if (!supportedFormats[fileType].input.includes(ext)) {
        toast({
          title: "Unsupported File",
          description: `${file.name} is not a supported file type`,
          variant: "destructive",
        });
        return;
      }

      // Create preview for images
      let previewUrl: string | undefined;
      if (fileType === "image") {
        previewUrl = URL.createObjectURL(file);
      }

      const newFile: FileItem = {
        id: Date.now().toString() + Math.random().toString(),
        file,
        originalFormat: ext,
        targetFormat: supportedFormats[fileType].output[0],
        status: "pending",
        progress: 0,
        previewUrl
      };

      setFiles(prev => [...prev, newFile]);
    });

    toast({
      title: "Files Added",
      description: `${newFiles.length} file(s) ready for conversion`,
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const convertFile = async (fileItem: FileItem) => {
    setFiles(prev => prev.map(f => 
      f.id === fileItem.id 
        ? { ...f, status: "converting" as ConversionStatus, progress: 0 }
        : f
    ));

    try {
      // Simulate conversion progress
      for (let i = 0; i <= 100; i += 5) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, progress: i }
            : f
        ));
      }

      const convertedBlob = await simulateConversion(fileItem);
      const downloadUrl = URL.createObjectURL(convertedBlob);

      const updatedFile = {
        ...fileItem,
        status: "completed" as ConversionStatus,
        downloadUrl,
        progress: 100,
        convertedSize: convertedBlob.size
      };

      setFiles(prev => prev.map(f => 
        f.id === fileItem.id ? updatedFile : f
      ));

      // Add to history
      setHistory(prev => [updatedFile, ...prev].slice(0, 50));

      toast({
        title: "Conversion Complete",
        description: `${fileItem.file.name} converted successfully`,
      });

    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id 
          ? { ...f, status: "error" as ConversionStatus, error: "Conversion failed" }
          : f
      ));

      toast({
        title: "Conversion Failed",
        description: `Failed to convert ${fileItem.file.name}`,
        variant: "destructive",
      });
    }
  };

  const simulateConversion = async (fileItem: FileItem): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Apply compression simulation
        let sizeMultiplier = 1;
        if (settings.compression === "low") sizeMultiplier = 0.9;
        if (settings.compression === "medium") sizeMultiplier = 0.7;
        if (settings.compression === "high") sizeMultiplier = 0.5;

        const estimatedSize = Math.floor(fileItem.file.size * sizeMultiplier);
        const blob = new Blob([fileItem.file.slice(0, estimatedSize)], { 
          type: getMimeType(fileItem.targetFormat) 
        });
        resolve(blob);
      };
      reader.readAsArrayBuffer(fileItem.file);
    });
  };

  const getMimeType = (format: string): string => {
    const mimeTypes: { [key: string]: string } = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      gif: "image/gif",
      pdf: "application/pdf",
      txt: "text/plain",
      html: "text/html",
      mp3: "audio/mpeg",
      wav: "audio/wav",
      mp4: "video/mp4",
      webm: "video/webm",
      zip: "application/zip"
    };
    return mimeTypes[format] || "application/octet-stream";
  };

  const updateTargetFormat = (fileId: string, format: string) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, targetFormat: format } : f
    ));
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      if (file?.downloadUrl) URL.revokeObjectURL(file.downloadUrl);
      if (file?.previewUrl) URL.revokeObjectURL(file.previewUrl);
      return prev.filter(f => f.id !== fileId);
    });
  };

  const downloadFile = (fileItem: FileItem) => {
    if (fileItem.downloadUrl) {
      const link = document.createElement('a');
      link.href = fileItem.downloadUrl;
      link.download = `${fileItem.file.name.split('.')[0]}.${fileItem.targetFormat}`;
      link.click();
    }
  };

  const downloadAll = () => {
    files
      .filter(f => f.status === "completed" && f.downloadUrl)
      .forEach(file => downloadFile(file));
  };

  const convertAllPending = () => {
    files
      .filter(f => f.status === "pending")
      .forEach(file => convertFile(file));
  };

  const clearCompleted = () => {
    setFiles(prev => {
      const completed = prev.filter(f => f.status === "completed");
      completed.forEach(f => {
        if (f.downloadUrl) URL.revokeObjectURL(f.downloadUrl);
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      });
      return prev.filter(f => f.status !== "completed");
    });
  };

  const clearAll = () => {
    files.forEach(f => {
      if (f.downloadUrl) URL.revokeObjectURL(f.downloadUrl);
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });
    setFiles([]);
  };

  const applyPreset = (preset: ConversionPreset) => {
    setSettings(prev => ({ ...prev, ...preset.settings }));
    setSelectedPreset(preset.id);
    
    // Apply target format to all pending files of compatible type
    setFiles(prev => prev.map(f => {
      if (f.status === "pending") {
        const fileType = getFileType(f.file.name);
        if (supportedFormats[fileType].output.includes(preset.targetFormat)) {
          return { ...f, targetFormat: preset.targetFormat };
        }
      }
      return f;
    }));

    toast({
      title: "Preset Applied",
      description: `${preset.name} settings applied`,
    });
  };

  const getStats = () => {
    const totalFiles = files.length;
    const completed = files.filter(f => f.status === "completed").length;
    const converting = files.filter(f => f.status === "converting").length;
    const totalSaved = files
      .filter(f => f.status === "completed" && f.convertedSize)
      .reduce((acc, f) => acc + (f.file.size - (f.convertedSize || 0)), 0);
    
    return { totalFiles, completed, converting, totalSaved };
  };

  const stats = getStats();

  const filteredHistory = history.filter(entry => {
    const matchesSearch = entry.file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const fileType = getFileType(entry.file.name);
    const matchesType = filterType === "all" || fileType === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <RefreshCw className="w-8 h-8 text-blue-500" />
            Advanced File Converter
          </h2>
          <p className="text-slate-600 mt-1">
            Convert, compress, and optimize files with advanced features
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Files</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalFiles}</p>
              </div>
              <File className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Completed</p>
                <p className="text-2xl font-bold text-slate-900">{stats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Converting</p>
                <p className="text-2xl font-bold text-slate-900">{stats.converting}</p>
              </div>
              <Clock className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Space Saved</p>
                <p className="text-2xl font-bold text-slate-900">
                  {(stats.totalSaved / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
              <HardDrive className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="convert">
            <RefreshCw className="w-4 h-4 mr-2" />
            Convert
          </TabsTrigger>
          <TabsTrigger value="compress">
            <Minimize2 className="w-4 h-4 mr-2" />
            Compress
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="w-4 h-4 mr-2" />
            History ({history.length})
          </TabsTrigger>
          <TabsTrigger value="tools">
            <Layers className="w-4 h-4 mr-2" />
            Tools
          </TabsTrigger>
        </TabsList>

        {/* Convert Tab */}
        <TabsContent value="convert" className="space-y-4">
          {/* Upload Area */}
          <Card>
            <CardContent className="p-6">
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
                  dragActive 
                    ? "border-blue-500 bg-blue-50 scale-105" 
                    : "border-slate-300 hover:border-slate-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                <p className="text-xl font-semibold text-slate-900 mb-2">
                  Drop files here or click to upload
                </p>
                <p className="text-sm text-slate-500 mb-6">
                  Supports images, documents, audio, video, and archives • Max 100MB per file
                </p>
                <div className="flex justify-center gap-2">
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Files
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Info className="w-4 h-4 mr-2" />
                        Supported Formats
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>Supported File Formats</DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {Object.entries(supportedFormats).map(([type, formats]) => {
                          const IconComponent = getFileIcon(type as FileType);
                          return (
                            <div key={type} className="p-4 border rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <IconComponent className="w-5 h-5 text-blue-500" />
                                <h4 className="font-semibold capitalize">{type}</h4>
                              </div>
                              <p className="text-xs text-slate-600 mb-2">{formats.description}</p>
                              <div className="text-xs">
                                <p className="text-slate-700"><strong>Input:</strong> {formats.input.join(", ")}</p>
                                <p className="text-slate-700 mt-1"><strong>Output:</strong> {formats.output.join(", ")}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  aria-label="Upload files"
                  onChange={(e) => e.target.files && handleFiles(e.target.files)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Presets */}
          {files.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Presets</CardTitle>
                <CardDescription>Apply optimized settings for common use cases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {conversionPresets.map(preset => {
                    const Icon = preset.icon;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => applyPreset(preset)}
                        className={`p-4 border-2 rounded-lg transition-all text-left ${
                          selectedPreset === preset.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <Icon className="w-6 h-6 mb-2 text-blue-500" />
                        <div className="font-semibold text-sm">{preset.name}</div>
                        <div className="text-xs text-slate-600">{preset.description}</div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* File List */}
          {files.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Files ({files.length})</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSettings(!showSettings)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={convertAllPending}
                      disabled={!files.some(f => f.status === "pending")}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Convert All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadAll}
                      disabled={!files.some(f => f.status === "completed")}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAll}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Settings Panel */}
                {showSettings && (
                  <div className="p-4 border rounded-lg bg-slate-50 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Conversion Settings</h3>
                      <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Quality: {settings.quality}%</Label>
                        <Slider
                          value={[settings.quality]}
                          onValueChange={(v) => setSettings({ ...settings, quality: v[0] })}
                          min={10}
                          max={100}
                          step={5}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Compression</Label>
                        <Select
                          value={settings.compression}
                          onValueChange={(v: any) => setSettings({ ...settings, compression: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Audio Bitrate</Label>
                        <Select
                          value={settings.audioBitrate}
                          onValueChange={(v) => setSettings({ ...settings, audioBitrate: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="128">128 kbps</SelectItem>
                            <SelectItem value="192">192 kbps</SelectItem>
                            <SelectItem value="256">256 kbps</SelectItem>
                            <SelectItem value="320">320 kbps</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {/* File Items */}
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3 pr-4">
                    {files.map((fileItem) => {
                      const IconComponent = getFileIcon(getFileType(fileItem.file.name));
                      const fileType = getFileType(fileItem.file.name);
                      
                      return (
                        <div key={fileItem.id} className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                          <div className="flex items-start gap-4">
                            {/* Preview */}
                            {fileItem.previewUrl && (
                              <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100">
                                <img 
                                  src={fileItem.previewUrl} 
                                  alt="Preview" 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            {!fileItem.previewUrl && (
                              <div className="w-20 h-20 flex-shrink-0 rounded-lg bg-slate-100 flex items-center justify-center">
                                <IconComponent className="w-8 h-8 text-slate-400" />
                              </div>
                            )}

                            {/* File Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-slate-900 truncate">{fileItem.file.name}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <p className="text-xs text-slate-500">
                                      {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                    {fileItem.convertedSize && (
                                      <>
                                        <span className="text-xs text-slate-400">→</span>
                                        <p className="text-xs text-green-600 font-medium">
                                          {(fileItem.convertedSize / 1024 / 1024).toFixed(2)} MB
                                          {' '}({Math.round((1 - fileItem.convertedSize / fileItem.file.size) * 100)}% saved)
                                        </p>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {/* Status Badge */}
                                <div className="flex items-center gap-2">
                                  {fileItem.status === "pending" && (
                                    <Badge variant="secondary">Pending</Badge>
                                  )}
                                  {fileItem.status === "converting" && (
                                    <Badge className="bg-blue-100 text-blue-800">
                                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                                      Converting
                                    </Badge>
                                  )}
                                  {fileItem.status === "completed" && (
                                    <Badge className="bg-green-100 text-green-800">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Done
                                    </Badge>
                                  )}
                                  {fileItem.status === "error" && (
                                    <Badge variant="destructive">
                                      <AlertCircle className="w-3 h-3 mr-1" />
                                      Error
                                    </Badge>
                                  )}
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeFile(fileItem.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>

                              {/* Conversion Controls */}
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-slate-600">Convert to:</span>
                                  <Select
                                    value={fileItem.targetFormat}
                                    onValueChange={(value) => updateTargetFormat(fileItem.id, value)}
                                    disabled={fileItem.status === "converting"}
                                  >
                                    <SelectTrigger className="w-28">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {supportedFormats[fileType].output.map(format => (
                                        <SelectItem key={format} value={format}>
                                          {format.toUpperCase()}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="flex gap-2">
                                  {fileItem.status === "pending" && (
                                    <Button size="sm" onClick={() => convertFile(fileItem)}>
                                      <Zap className="w-4 h-4 mr-2" />
                                      Convert
                                    </Button>
                                  )}
                                  
                                  {fileItem.status === "completed" && (
                                    <>
                                      <Button size="sm" onClick={() => downloadFile(fileItem)}>
                                        <Download className="w-4 h-4 mr-2" />
                                        Download
                                      </Button>
                                      {fileItem.downloadUrl && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => window.open(fileItem.downloadUrl, '_blank')}
                                        >
                                          <Eye className="w-4 h-4" />
                                        </Button>
                                      )}
                                    </>
                                  )}

                                  {fileItem.status === "error" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => convertFile(fileItem)}
                                    >
                                      <RefreshCw className="w-4 h-4 mr-2" />
                                      Retry
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {/* Progress Bar */}
                              {fileItem.status === "converting" && (
                                <div className="mt-3">
                                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                                    <span>Converting...</span>
                                    <span>{fileItem.progress}%</span>
                                  </div>
                                  <Progress value={fileItem.progress} className="h-2" />
                                </div>
                              )}

                              {fileItem.error && (
                                <p className="text-sm text-red-600 mt-2">{fileItem.error}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Compress Tab */}
        <TabsContent value="compress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>File Compression</CardTitle>
              <CardDescription>Reduce file size without conversion</CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12">
              <Minimize2 className="w-16 h-16 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-600 mb-4">
                Upload files to compress them without changing the format
              </p>
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Choose Files to Compress
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Conversion History</CardTitle>
                  <CardDescription>Your recent file conversions</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHistory([])}
                  disabled={history.length === 0}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear History
                </Button>
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
                    <SelectItem value="image">Images</SelectItem>
                    <SelectItem value="document">Documents</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="h-[500px]">
                {filteredHistory.length > 0 ? (
                  <div className="space-y-2 pr-4">
                    {filteredHistory.map((item) => {
                      const IconComponent = getFileIcon(getFileType(item.file.name));
                      return (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <IconComponent className="w-5 h-5 text-slate-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.file.name}</p>
                              <p className="text-xs text-slate-500">
                                {item.originalFormat} → {item.targetFormat} • 
                                {(item.file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          {item.downloadUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadFile(item)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>
                      {history.length === 0 
                        ? "No conversion history yet"
                        : "No results found"}
                    </p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tools Tab */}
        <TabsContent value="tools" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scissors className="w-5 h-5" />
                  Split Files
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">
                  Split large files into smaller chunks
                </p>
                <Button variant="outline" className="w-full" disabled>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Combine className="w-5 h-5" />
                  Merge Files
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">
                  Combine multiple files into one
                </p>
                <Button variant="outline" className="w-full" disabled>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Archive className="w-5 h-5" />
                  Create Archive
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">
                  Compress multiple files into ZIP
                </p>
                <Button variant="outline" className="w-full" disabled>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
