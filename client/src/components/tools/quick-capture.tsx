import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Zap, Type, Mic, Camera, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface QuickCaptureProps {
  onNoteCaptured?: (note: any) => void;
}

export default function QuickCapture({ onNoteCaptured }: QuickCaptureProps) {
  const { toast } = useToast();
  const [quickText, setQuickText] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createQuickNoteMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/notes", data),
    onSuccess: (note) => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      toast({ title: "Quick note captured!" });
      setQuickText("");
      onNoteCaptured?.(note);
    },
  });

  const handleQuickCapture = () => {
    if (!quickText.trim()) return;
    
    const timestamp = new Date().toLocaleString();
    createQuickNoteMutation.mutate({
      title: `Quick Note - ${timestamp}`,
      content: `<p>${quickText}</p>`,
      contentType: "rich",
      folder: "Quick Captures",
      tags: ["quick-capture"],
      smartTags: ["quick"],
      wordCount: quickText.split(/\s+/).length,
      readingTime: 1,
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsCapturing(true);
    
    if (file.type.startsWith('image/')) {
      // Handle image upload
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        const timestamp = new Date().toLocaleString();
        
        createQuickNoteMutation.mutate({
          title: `Image Capture - ${timestamp}`,
          content: `<img src="${base64}" alt="Captured image" style="max-width: 100%;" />`,
          contentType: "rich",
          folder: "Quick Captures",
          tags: ["image-capture", "quick-capture"],
          smartTags: ["image", "quick"],
          attachments: {
            images: [{
              name: file.name,
              type: file.type,
              size: file.size,
              data: base64
            }]
          },
          wordCount: 0,
          readingTime: 0,
        });
        setIsCapturing(false);
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'text/plain') {
      // Handle text file upload
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const timestamp = new Date().toLocaleString();
        
        createQuickNoteMutation.mutate({
          title: `File: ${file.name}`,
          content: `<pre>${text}</pre>`,
          contentType: "rich",
          folder: "Quick Captures",
          tags: ["file-capture", "quick-capture"],
          smartTags: ["file", "text", "quick"],
          attachments: {
            files: [{
              name: file.name,
              type: file.type,
              size: file.size
            }]
          },
          wordCount: text.split(/\s+/).length,
          readingTime: Math.ceil(text.split(/\s+/).length / 200),
        });
        setIsCapturing(false);
      };
      reader.readAsText(file);
    } else {
      toast({
        title: "Unsupported file type",
        description: "Please upload an image or text file.",
        variant: "destructive",
      });
      setIsCapturing(false);
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-medium">Quick Capture</span>
        </div>
        
        <div className="flex gap-2 mb-3">
          <Input
            placeholder="Quick thought, idea, or note..."
            value={quickText}
            onChange={(e) => setQuickText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuickCapture()}
            className="flex-1"
          />
          <Button 
            size="sm" 
            onClick={handleQuickCapture}
            disabled={!quickText.trim() || createQuickNoteMutation.isPending}
          >
            <Type className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Or capture:</span>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,text/plain"
            onChange={handleFileUpload}
            className="hidden"
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isCapturing}
          >
            <Camera className="h-4 w-4 mr-1" />
            Image
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isCapturing}
          >
            <FileText className="h-4 w-4 mr-1" />
            File
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}