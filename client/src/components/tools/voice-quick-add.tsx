import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Mic, MicOff, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { parseNaturalLanguageTask } from "@/lib/nlp-parser";

// Type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new(): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new(): SpeechRecognition;
    };
  }
}

interface VoiceQuickAddProps {
  onTaskAdded?: () => void;
}

export default function VoiceQuickAdd({ onTaskAdded }: VoiceQuickAddProps) {
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const createTodoMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/todos", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      toast({ title: "Task added via voice!" });
      setTranscript("");
      onTaskAdded?.();
    },
  });

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setTranscript(finalTranscript);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        toast({
          title: "Voice recognition error",
          description: "Please try again or check microphone permissions",
          variant: "destructive",
        });
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [toast]);

  const startListening = () => {
    if (recognitionRef.current) {
      setTranscript("");
      setIsListening(true);
      recognitionRef.current.start();
    } else {
      toast({
        title: "Voice recognition not supported",
        description: "Your browser doesn't support voice recognition",
        variant: "destructive",
      });
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const handleSubmit = () => {
    if (!transcript.trim()) return;
    
    const parsed = parseNaturalLanguageTask(transcript);
    
    createTodoMutation.mutate({
      title: parsed.title,
      description: parsed.description,
      priority: parsed.priority,
      urgency: parsed.urgency,
      importance: parsed.importance,
      tags: parsed.tags,
      labels: parsed.labels,
      category: parsed.category,
      dueDate: parsed.dueDate,
      reminderDate: parsed.reminderDate,
      estimatedDuration: parsed.estimatedDuration,
      isRecurring: parsed.isRecurring,
      recurringPattern: parsed.recurringPattern,
      originalText: parsed.originalText,
      completed: false,
      customFields: {},
      parentId: null,
      position: 0,
    });
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Button
            variant={isListening ? "destructive" : "outline"}
            size="sm"
            onClick={isListening ? stopListening : startListening}
            disabled={createTodoMutation.isPending}
          >
            {isListening ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
          
          <div className="flex-1">
            {isListening ? (
              <div className="text-sm text-blue-600 animate-pulse">
                Listening... Speak your task
              </div>
            ) : transcript ? (
              <div className="text-sm">{transcript}</div>
            ) : (
              <div className="text-sm text-gray-500">
                Click microphone to add task by voice
              </div>
            )}
          </div>

          {transcript && (
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={createTodoMutation.isPending}
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}