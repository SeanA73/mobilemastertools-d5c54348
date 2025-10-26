import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Globe, Download, FileText, ImageIcon, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface WebClipperProps {
  onClipSaved?: (clip: any) => void;
}

export default function WebClipper({ onClipSaved }: WebClipperProps) {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [clipType, setClipType] = useState<'full' | 'simplified' | 'text'>('simplified');
  const [isClipping, setIsClipping] = useState(false);

  const createWebClipMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/web-clips", data),
    onSuccess: (clip) => {
      queryClient.invalidateQueries({ queryKey: ["/api/web-clips"] });
      toast({ title: "Web page clipped successfully!" });
      setUrl("");
      onClipSaved?.(clip);
    },
    onError: () => {
      toast({ 
        title: "Failed to clip page", 
        description: "Please check the URL and try again.",
        variant: "destructive" 
      });
    },
  });

  const handleClip = async () => {
    if (!url.trim()) return;
    
    try {
      setIsClipping(true);
      
      // Validate URL
      new URL(url);
      
      // Extract domain
      const domain = new URL(url).hostname;
      
      // For now, we'll create a basic clip with URL metadata
      // In a real implementation, you'd use a service like Mercury Parser or Readability
      const clipData = {
        url,
        title: `Clipped from ${domain}`,
        content: `<p>Content from: <a href="${url}" target="_blank">${url}</a></p>`,
        snippet: `Page clipped from ${domain}`,
        domain,
        clipType,
        metadata: {
          clippedAt: new Date().toISOString(),
          originalUrl: url,
          clipMethod: 'manual'
        }
      };

      createWebClipMutation.mutate(clipData);
    } catch (error) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid web address.",
        variant: "destructive",
      });
    } finally {
      setIsClipping(false);
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Web Clipper
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="https://example.com/article"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleClip()}
            className="flex-1"
          />
          <Select value={clipType} onValueChange={(value: any) => setClipType(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Full
                </div>
              </SelectItem>
              <SelectItem value="simplified">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Clean
                </div>
              </SelectItem>
              <SelectItem value="text">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Text
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={handleClip} 
            disabled={!url.trim() || isClipping}
          >
            <Download className="h-4 w-4 mr-2" />
            {isClipping ? 'Clipping...' : 'Clip'}
          </Button>
        </div>
        
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p className="mb-2">Clip types:</p>
          <ul className="space-y-1">
            <li><strong>Full:</strong> Complete page with images and formatting</li>
            <li><strong>Clean:</strong> Article content without ads and navigation</li>
            <li><strong>Text:</strong> Plain text content only</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}