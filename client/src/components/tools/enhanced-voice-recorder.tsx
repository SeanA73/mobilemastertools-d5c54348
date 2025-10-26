import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  Mic, MicOff, Play, Pause, Square, Trash2, Download, 
  Clock, FileAudio, Share2, Copy, Mail, MessageSquare,
  FileText, Languages, Volume2, Edit3, Eye, EyeOff,
  Twitter, Facebook, Linkedin, Phone, Send, Globe,
  FileDown, FileType, Search, Wand2, SplitSquareVertical
} from "lucide-react";
import { format } from "date-fns";

// Supported languages for transcription
const SUPPORTED_LANGUAGES = [
  { code: "en-US", name: "English (US)" },
  { code: "en-GB", name: "English (UK)" },
  { code: "es-ES", name: "Spanish (Spain)" },
  { code: "es-MX", name: "Spanish (Mexico)" },
  { code: "fr-FR", name: "French" },
  { code: "de-DE", name: "German" },
  { code: "it-IT", name: "Italian" },
  { code: "pt-BR", name: "Portuguese (Brazil)" },
  { code: "ru-RU", name: "Russian" },
  { code: "ja-JP", name: "Japanese" },
  { code: "ko-KR", name: "Korean" },
  { code: "zh-CN", name: "Chinese (Simplified)" },
  { code: "ar-SA", name: "Arabic" },
  { code: "hi-IN", name: "Hindi" },
  { code: "nl-NL", name: "Dutch" },
  { code: "sv-SE", name: "Swedish" },
  { code: "da-DK", name: "Danish" },
  { code: "no-NO", name: "Norwegian" },
  { code: "pl-PL", name: "Polish" },
  { code: "tr-TR", name: "Turkish" }
];

const recordingSchema = z.object({
  title: z.string().min(1, "Title is required"),
  transcriptLanguage: z.string().default("en-US"),
});

type RecordingFormData = z.infer<typeof recordingSchema>;

interface VoiceRecording {
  id: number;
  userId: string;
  title: string;
  duration: number;
  blob: string;
  transcript?: string;
  transcriptLanguage: string;
  summary?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export default function EnhancedVoiceRecorderTool() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentRecording, setCurrentRecording] = useState<Blob | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("en-US");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [showTranscript, setShowTranscript] = useState<{ [key: number]: boolean }>({});
  const [shareDialog, setShareDialog] = useState<{ open: boolean; recording: VoiceRecording | null }>({
    open: false,
    recording: null
  });
  const [exportDialog, setExportDialog] = useState<{ open: boolean; recording: VoiceRecording | null }>({
    open: false,
    recording: null
  });
  const [searchQuery, setSearchQuery] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const form = useForm<RecordingFormData>({
    resolver: zodResolver(recordingSchema),
    defaultValues: {
      title: "",
      transcriptLanguage: "en-US",
    },
  });

  // Local storage for recordings (fallback when no database)
  const [localRecordings, setLocalRecordings] = useState<VoiceRecording[]>([]);
  
  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('voice-recordings');
    if (stored) {
      try {
        setLocalRecordings(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load recordings from localStorage');
      }
    }
  }, []);
  
  // Save to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('voice-recordings', JSON.stringify(localRecordings));
  }, [localRecordings]);

  // Query for fetching recordings from server (will fallback to localStorage)
  const { data: serverRecordings = [], refetch } = useQuery({
    queryKey: ['/api/voice-recordings'],
    queryFn: () => apiRequest("GET", "/api/voice-recordings").then(res => res.json()).catch(() => [])
  });
  
  // Use server recordings if available, otherwise use localStorage
  const recordings = serverRecordings.length > 0 ? serverRecordings : localRecordings;

  // Mutation for creating recordings (with localStorage fallback)
  const createRecordingMutation = useMutation({
    mutationFn: async (data: any) => {
      // Always use localStorage in development mode
      const newRecording: VoiceRecording = {
        id: Date.now(),
        userId: 'local-user',
        title: data.title,
        duration: data.duration,
        blob: data.blob,
        transcript: data.transcript || "",
        transcriptLanguage: data.transcriptLanguage,
        summary: data.summary || "",
        tags: data.tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setLocalRecordings(prev => [newRecording, ...prev]);
      return newRecording;
    },
    onSuccess: () => {
      setIsDialogOpen(false);
      form.reset();
      setCurrentRecording(null);
      setLiveTranscript("");
      toast({
        title: "Recording Saved! 🎤",
        description: "Your voice recording has been saved successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Save recording error:', error);
      toast({
        title: "Error",
        description: "Failed to save recording. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Mutation for updating transcripts
  const updateTranscriptMutation = useMutation({
    mutationFn: async ({ id, transcript, summary }: { id: number; transcript: string; summary?: string }) => {
      // Update in localStorage
      setLocalRecordings(prev => prev.map(rec => 
        rec.id === id 
          ? { ...rec, transcript, summary: summary || rec.summary, updatedAt: new Date().toISOString() }
          : rec
      ));
      return { id, transcript, summary };
    },
    onSuccess: () => {
      toast({
        title: "Transcript Updated",
        description: "Transcript has been generated successfully.",
      });
    }
  });

  // Mutation for deleting recordings
  const deleteRecordingMutation = useMutation({
    mutationFn: async (id: number) => {
      // Delete from localStorage
      setLocalRecordings(prev => prev.filter(rec => rec.id !== id));
      return id;
    },
    onSuccess: () => {
      toast({
        title: "Recording Deleted",
        description: "Voice recording has been deleted.",
      });
    }
  });

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setLiveTranscript(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      
      // Use WebM format with Opus codec for better compression, fallback to other formats
      let options: MediaRecorderOptions = {};
      
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options = {
          mimeType: 'audio/webm;codecs=opus',
          audioBitsPerSecond: 32000
        };
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options = {
          mimeType: 'audio/mp4',
          audioBitsPerSecond: 32000
        };
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        options = {
          mimeType: 'audio/webm',
          audioBitsPerSecond: 32000
        };
      }
      
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      const chunks: BlobPart[] = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const blob = new Blob(chunks, { type: mimeType });
        setCurrentRecording(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setDuration(0);

      // Start live transcription
      if (recognitionRef.current) {
        recognitionRef.current.lang = selectedLanguage;
        recognitionRef.current.start();
      }

      // Start timer
      intervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      toast({
        title: "Recording Started",
        description: "Your voice recording has begun with live transcription.",
      });
    } catch (error) {
      toast({
        title: "Microphone Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);

      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      setIsDialogOpen(true);
    }
  };

  // Pause/Resume recording
  const togglePause = () => {
    if (mediaRecorderRef.current) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        if (recognitionRef.current) {
          recognitionRef.current.start();
        }
      } else {
        mediaRecorderRef.current.pause();
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      }
      setIsPaused(!isPaused);
    }
  };

  // Play audio
  const playAudio = (recording: VoiceRecording) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    try {
      // Try to detect the correct MIME type from the blob data or use a fallback
      const mimeType = recording.blob.startsWith('UklGR') ? 'audio/wav' : 'audio/webm';
      const audio = new Audio(`data:${mimeType};base64,${recording.blob}`);
      audioRef.current = audio;
      
      audio.onended = () => setPlayingId(null);
      audio.onerror = () => {
        setPlayingId(null);
        toast({
          title: "Playback Error",
          description: "Could not play this recording. The audio data may be corrupted.",
          variant: "destructive",
        });
      };
      
      audio.play().catch(() => {
        setPlayingId(null);
        toast({
          title: "Playback Error",
          description: "Could not play this recording. Please try again.",
          variant: "destructive",
        });
      });
      setPlayingId(recording.id);
    } catch (error) {
      toast({
        title: "Playback Error",
        description: "Could not play this recording. The audio format may not be supported.",
        variant: "destructive",
      });
    }
  };

  // Stop audio
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPlayingId(null);
  };

  // Generate transcript
  const generateTranscript = async (recording: VoiceRecording) => {
    setIsTranscribing(true);
    try {
      // Using Web Speech API for transcript generation
      const audioBlob = new Blob([Uint8Array.from(atob(recording.blob), c => c.charCodeAt(0))], { type: 'audio/wav' });
      
      // For now, we'll use a placeholder transcript since we need audio processing
      // In a real implementation, you'd send the audio to a transcription service
      const mockTranscript = `This is a sample transcript for the recording "${recording.title}". The actual implementation would use a speech-to-text service to generate the real transcript from the audio data.`;
      
      const mockSummary = `Summary: This recording discusses ${recording.title} and contains important information that was captured during the session.`;

      await updateTranscriptMutation.mutateAsync({
        id: recording.id,
        transcript: mockTranscript,
        summary: mockSummary
      });
    } catch (error) {
      toast({
        title: "Transcription Failed",
        description: "Could not generate transcript. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  // Share recording
  const shareRecording = (recording: VoiceRecording) => {
    setShareDialog({ open: true, recording });
  };

  // Copy transcript to clipboard
  const copyTranscript = async (transcript: string) => {
    try {
      await navigator.clipboard.writeText(transcript);
      toast({
        title: "Copied",
        description: "Transcript copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  // Share via email
  const shareViaEmail = (recording: VoiceRecording) => {
    const subject = encodeURIComponent(`Voice Recording: ${recording.title}`);
    const body = encodeURIComponent(`
Voice Recording: ${recording.title}
Duration: ${Math.floor(recording.duration / 60)}:${(recording.duration % 60).toString().padStart(2, '0')}
Recorded: ${format(new Date(recording.createdAt), 'PPP')}

${recording.transcript ? `Transcript:\n${recording.transcript}` : 'No transcript available.'}

${recording.summary ? `\nSummary:\n${recording.summary}` : ''}
    `);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  // Share via WhatsApp
  const shareViaWhatsApp = (recording: VoiceRecording) => {
    const text = encodeURIComponent(`🎙️ Voice Recording: ${recording.title}\n\n${recording.transcript || 'Audio recording'}\n\nDuration: ${formatDuration(recording.duration)}`);
    window.open(`https://wa.me/?text=${text}`);
  };

  // Share via SMS
  const shareViaSMS = (recording: VoiceRecording) => {
    const text = encodeURIComponent(`Voice Recording: ${recording.title}\n${recording.transcript || 'Audio recording'}`);
    window.open(`sms:?body=${text}`);
  };

  // Share via Telegram
  const shareViaTelegram = (recording: VoiceRecording) => {
    const text = encodeURIComponent(`🎙️ ${recording.title}\n\n${recording.transcript || 'Audio recording'}`);
    window.open(`https://t.me/share/url?text=${text}`);
  };

  // Export transcript as text file
  const exportAsText = (recording: VoiceRecording) => {
    const content = `Voice Recording: ${recording.title}
Duration: ${formatDuration(recording.duration)}
Date: ${format(new Date(recording.createdAt), 'PPP')}
Language: ${recording.transcriptLanguage}

=== TRANSCRIPT ===
${recording.transcript || 'No transcript available'}

${recording.summary ? `\n=== SUMMARY ===\n${recording.summary}` : ''}

${recording.tags && recording.tags.length > 0 ? `\n=== TAGS ===\n${recording.tags.join(', ')}` : ''}
`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recording.title.replace(/[^a-z0-9]/gi, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Exported",
      description: "Transcript exported as text file",
    });
  };

  // Export transcript as Markdown
  const exportAsMarkdown = (recording: VoiceRecording) => {
    const content = `# ${recording.title}

**Duration:** ${formatDuration(recording.duration)}  
**Date:** ${format(new Date(recording.createdAt), 'PPP')}  
**Language:** ${recording.transcriptLanguage}

## Transcript

${recording.transcript || '*No transcript available*'}

${recording.summary ? `## Summary\n\n${recording.summary}` : ''}

${recording.tags && recording.tags.length > 0 ? `## Tags\n\n${recording.tags.map(t => `- ${t}`).join('\n')}` : ''}
`;
    
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recording.title.replace(/[^a-z0-9]/gi, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Exported",
      description: "Transcript exported as Markdown file",
    });
  };

  // Export audio file
  const exportAudioFile = (recording: VoiceRecording) => {
    try {
      const audioBlob = new Blob(
        [Uint8Array.from(atob(recording.blob), c => c.charCodeAt(0))],
        { type: 'audio/wav' }
      );
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${recording.title.replace(/[^a-z0-9]/gi, '_')}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Downloaded",
        description: "Audio file downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not download audio file",
        variant: "destructive",
      });
    }
  };

  // Generate AI-powered summary (mock for now)
  const generateAISummary = async (recording: VoiceRecording) => {
    if (!recording.transcript) {
      toast({
        title: "No Transcript",
        description: "Generate a transcript first before creating a summary",
        variant: "destructive",
      });
      return;
    }

    setIsTranscribing(true);
    try {
      // Mock AI summary - in production, this would call an AI service
      const words = recording.transcript.split(' ');
      const sentences = recording.transcript.split(/[.!?]+/).filter(s => s.trim());
      const aiSummary = `AI Summary: This ${formatDuration(recording.duration)} recording contains ${words.length} words across ${sentences.length} sentences. Key points: ${sentences.slice(0, 3).map(s => s.trim()).join('. ')}.`;
      
      await updateTranscriptMutation.mutateAsync({
        id: recording.id,
        transcript: recording.transcript,
        summary: aiSummary
      });
      
      toast({
        title: "Summary Generated",
        description: "AI summary created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not generate summary",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  // Share via social media
  const shareViaSocial = (platform: string, recording: VoiceRecording) => {
    const text = encodeURIComponent(`Check out this voice recording: ${recording.title}`);
    const url = encodeURIComponent(window.location.href);

    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`);
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`);
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`);
        break;
    }
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle form submission
  const onSubmit = async (data: RecordingFormData) => {
    if (!currentRecording) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      createRecordingMutation.mutate({
        title: data.title,
        duration,
        blob: base64,
        transcript: liveTranscript || "",
        transcriptLanguage: selectedLanguage,
        summary: "",
        tags: [],
      });
    };
    reader.readAsDataURL(currentRecording);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Recording Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mic className="h-5 w-5" />
            <span>Enhanced Voice Recorder</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Language Selection */}
          <div className="flex items-center space-x-4">
            <Label className="flex items-center space-x-2">
              <Languages className="h-4 w-4" />
              <span>Transcription Language:</span>
            </Label>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recording Status */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="font-medium">
                {isRecording ? (isPaused ? 'Paused' : 'Recording') : 'Ready'}
              </span>
              <Badge variant="outline" className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{formatDuration(duration)}</span>
              </Badge>
            </div>

            <div className="flex items-center space-x-2">
              {!isRecording ? (
                <Button onClick={startRecording} className="bg-red-500 hover:bg-red-600">
                  <Mic className="h-4 w-4 mr-2" />
                  Start Recording
                </Button>
              ) : (
                <>
                  <Button onClick={togglePause} variant="outline">
                    {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  </Button>
                  <Button onClick={stopRecording} variant="destructive">
                    <Square className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Live Transcript */}
          {isRecording && liveTranscript && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Live Transcript</span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300">{liveTranscript}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recordings List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileAudio className="h-5 w-5" />
            <span>Your Recordings ({recordings.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          {recordings.length > 0 && (
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search recordings by title, transcript, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          )}

          {recordings.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <FileAudio className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p>No recordings yet. Start your first recording above!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recordings
                .filter((recording: VoiceRecording) => {
                  if (!searchQuery) return true;
                  const query = searchQuery.toLowerCase();
                  return recording.title.toLowerCase().includes(query) ||
                         recording.transcript?.toLowerCase().includes(query) ||
                         recording.tags?.some(tag => tag.toLowerCase().includes(query));
                })
                .map((recording: VoiceRecording) => (
                <div key={recording.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-900 dark:text-slate-100">{recording.title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-slate-500">
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDuration(recording.duration)}</span>
                        </span>
                        <span>{format(new Date(recording.createdAt), 'PPp')}</span>
                        {recording.transcriptLanguage && (
                          <Badge variant="outline" className="text-xs">
                            {SUPPORTED_LANGUAGES.find(l => l.code === recording.transcriptLanguage)?.name}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {playingId === recording.id ? (
                        <Button onClick={stopAudio} size="sm" variant="outline">
                          <Square className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button onClick={() => playAudio(recording)} size="sm" variant="outline">
                          <Play className="h-4 w-4" />
                        </Button>
                      )}

                      {recording.transcript ? (
                        <Button
                          onClick={() => setShowTranscript(prev => ({
                            ...prev,
                            [recording.id]: !prev[recording.id]
                          }))}
                          size="sm"
                          variant="outline"
                        >
                          {showTranscript[recording.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      ) : (
                        <Button
                          onClick={() => generateTranscript(recording)}
                          size="sm"
                          variant="outline"
                          disabled={isTranscribing}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      )}

                      <Button onClick={() => shareRecording(recording)} size="sm" variant="outline" title="Share">
                        <Share2 className="h-4 w-4" />
                      </Button>

                      <Button onClick={() => setExportDialog({ open: true, recording })} size="sm" variant="outline" title="Export">
                        <FileDown className="h-4 w-4" />
                      </Button>

                      {recording.transcript && (
                        <Button
                          onClick={() => generateAISummary(recording)}
                          size="sm"
                          variant="outline"
                          title="Generate AI Summary"
                          disabled={isTranscribing}
                        >
                          <Wand2 className="h-4 w-4" />
                        </Button>
                      )}

                      <Button
                        onClick={() => deleteRecordingMutation.mutate(recording.id)}
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Transcript Display */}
                  {showTranscript[recording.id] && recording.transcript && (
                    <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Transcript</span>
                        <Button
                          onClick={() => copyTranscript(recording.transcript!)}
                          size="sm"
                          variant="ghost"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                        {recording.transcript}
                      </p>
                      {recording.summary && (
                        <div className="mt-3 pt-3 border-t">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Summary:</span>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{recording.summary}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Recording Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Recording</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recording Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter a title for your recording" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {liveTranscript && (
                <div className="space-y-2">
                  <Label>Live Transcript Preview</Label>
                  <Textarea
                    value={liveTranscript}
                    onChange={(e) => setLiveTranscript(e.target.value)}
                    placeholder="Transcript will appear here..."
                    rows={4}
                  />
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createRecordingMutation.isPending}>
                  {createRecordingMutation.isPending ? "Saving..." : "Save Recording"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialog.open} onOpenChange={(open) => setShareDialog({ open, recording: null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share Recording</DialogTitle>
          </DialogHeader>
          {shareDialog.recording && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-medium">{shareDialog.recording.title}</h3>
                <p className="text-sm text-slate-500">
                  {formatDuration(shareDialog.recording.duration)} • {format(new Date(shareDialog.recording.createdAt), 'PPP')}
                </p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => shareViaEmail(shareDialog.recording!)}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </Button>

                <Button
                  onClick={() => shareViaWhatsApp(shareDialog.recording!)}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>WhatsApp</span>
                </Button>

                <Button
                  onClick={() => shareViaSocial('twitter', shareDialog.recording!)}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Twitter className="h-4 w-4" />
                  <span>Twitter</span>
                </Button>

                <Button
                  onClick={() => shareViaSocial('facebook', shareDialog.recording!)}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Facebook className="h-4 w-4" />
                  <span>Facebook</span>
                </Button>

                <Button
                  onClick={() => shareViaSocial('linkedin', shareDialog.recording!)}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Linkedin className="h-4 w-4" />
                  <span>LinkedIn</span>
                </Button>

                <Button
                  onClick={() => shareViaSMS(shareDialog.recording!)}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Phone className="h-4 w-4" />
                  <span>SMS</span>
                </Button>

                <Button
                  onClick={() => shareViaTelegram(shareDialog.recording!)}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span>Telegram</span>
                </Button>

                {shareDialog.recording.transcript && (
                  <Button
                    onClick={() => copyTranscript(shareDialog.recording!.transcript!)}
                    variant="outline"
                    className="flex items-center space-x-2 col-span-2"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Copy Full Text</span>
                  </Button>
                )}
              </div>

              {shareDialog.recording.transcript && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-slate-500 mb-2">Preview:</p>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg max-h-32 overflow-y-auto">
                    <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-4">
                      {shareDialog.recording.transcript.substring(0, 200)}
                      {shareDialog.recording.transcript.length > 200 && '...'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={exportDialog.open} onOpenChange={(open) => setExportDialog({ open, recording: null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Export Recording</DialogTitle>
          </DialogHeader>
          {exportDialog.recording && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-medium">{exportDialog.recording.title}</h3>
                <p className="text-sm text-slate-500">
                  {formatDuration(exportDialog.recording.duration)} • {format(new Date(exportDialog.recording.createdAt), 'PPP')}
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="text-sm font-medium">Export Audio</h4>
                <Button
                  onClick={() => {
                    exportAudioFile(exportDialog.recording!);
                    setExportDialog({ open: false, recording: null });
                  }}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <FileAudio className="h-4 w-4 mr-2" />
                  <span>Download Audio (WAV)</span>
                </Button>

                {exportDialog.recording.transcript && (
                  <>
                    <Separator />
                    <h4 className="text-sm font-medium">Export Transcript</h4>
                    
                    <Button
                      onClick={() => {
                        exportAsText(exportDialog.recording!);
                        setExportDialog({ open: false, recording: null });
                      }}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      <span>Text File (.txt)</span>
                    </Button>

                    <Button
                      onClick={() => {
                        exportAsMarkdown(exportDialog.recording!);
                        setExportDialog({ open: false, recording: null });
                      }}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <FileType className="h-4 w-4 mr-2" />
                      <span>Markdown (.md)</span>
                    </Button>

                    <Button
                      onClick={() => {
                        copyTranscript(exportDialog.recording!.transcript!);
                        setExportDialog({ open: false, recording: null });
                      }}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      <span>Copy to Clipboard</span>
                    </Button>
                  </>
                )}

                {!exportDialog.recording.transcript && (
                  <div className="text-center py-4">
                    <p className="text-sm text-slate-500">Generate a transcript first to export text formats</p>
                    <Button
                      onClick={() => {
                        generateTranscript(exportDialog.recording!);
                        setExportDialog({ open: false, recording: null });
                      }}
                      size="sm"
                      className="mt-2"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Transcript
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}