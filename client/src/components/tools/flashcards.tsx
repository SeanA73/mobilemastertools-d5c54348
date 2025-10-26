import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Plus, Trash2, Edit, Eye, BookOpen, Brain, 
  BarChart3, Star, Clock, Flame, TrendingUp,
  Download, Upload, Search, Filter, Tag,
  CheckCircle2, XCircle, AlertCircle, Award,
  Zap, Target, Calendar, Shuffle, ListChecks,
  RotateCcw, ChevronLeft, ChevronRight, Home,
  Settings, Trophy, Sparkles
} from "lucide-react";
import { format } from "date-fns";
import type { FlashcardDeck, Flashcard } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const deckSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  tags: z.string().optional(),
  color: z.string().optional(),
});

const flashcardSchema = z.object({
  front: z.string().min(1, "Front side is required"),
  back: z.string().min(1, "Back side is required"),
  deckId: z.number(),
  hint: z.string().optional(),
  tags: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
});

type DeckFormData = z.infer<typeof deckSchema>;
type FlashcardFormData = z.infer<typeof flashcardSchema>;

// SM-2 Spaced Repetition Algorithm Implementation
interface CardReview {
  cardId: number;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: Date;
  lastReviewed: Date;
  totalReviews: number;
  correctCount: number;
  incorrectCount: number;
}

type StudyMode = "flip" | "quiz" | "type" | "matching";
type DifficultyResponse = "again" | "hard" | "good" | "easy";

const DECK_COLORS = [
  { value: "blue", label: "Blue", class: "bg-blue-500" },
  { value: "green", label: "Green", class: "bg-green-500" },
  { value: "purple", label: "Purple", class: "bg-purple-500" },
  { value: "orange", label: "Orange", class: "bg-orange-500" },
  { value: "pink", label: "Pink", class: "bg-pink-500" },
  { value: "red", label: "Red", class: "bg-red-500" },
];

export default function FlashcardsTool() {
  const { toast } = useToast();
  const [selectedDeck, setSelectedDeck] = useState<FlashcardDeck | null>(null);
  const [studyMode, setStudyMode] = useState(false);
  const [studyModeType, setStudyModeType] = useState<StudyMode>("flip");
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isDeckDialogOpen, setIsDeckDialogOpen] = useState(false);
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(false);
  const [isStatsDialogOpen, setIsStatsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTag, setFilterTag] = useState<string>("all");
  const [shuffled, setShuffled] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [streak, setStreak] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [importText, setImportText] = useState("");
  
  // Review data stored in localStorage for now (would be in DB in production)
  const [cardReviews, setCardReviews] = useState<Map<number, CardReview>>(new Map());

  const deckForm = useForm<DeckFormData>({
    resolver: zodResolver(deckSchema),
    defaultValues: {
      title: "",
      description: "",
      tags: "",
      color: "blue",
    },
  });

  const cardForm = useForm<FlashcardFormData>({
    resolver: zodResolver(flashcardSchema),
    defaultValues: {
      front: "",
      back: "",
      deckId: 0,
      hint: "",
      tags: "",
      difficulty: "medium",
    },
  });

  const { data: decks = [], isLoading: decksLoading } = useQuery<FlashcardDeck[]>({
    queryKey: ["/api/flashcard-decks"],
  });

  const { data: flashcards = [], isLoading: cardsLoading } = useQuery<Flashcard[]>({
    queryKey: ["/api/flashcards", selectedDeck?.id],
    enabled: !!selectedDeck,
  });

  // Load review data from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('flashcard-reviews');
    if (stored) {
      const data = JSON.parse(stored);
      setCardReviews(new Map(Object.entries(data).map(([k, v]: any) => [parseInt(k), {
        ...v,
        nextReview: new Date(v.nextReview),
        lastReviewed: new Date(v.lastReviewed),
      }])));
    }
  }, []);

  // Save review data to localStorage
  const saveReviews = (reviews: Map<number, CardReview>) => {
    const obj = Object.fromEntries(reviews);
    localStorage.setItem('flashcard-reviews', JSON.stringify(obj));
    setCardReviews(reviews);
  };

  // SM-2 Algorithm for calculating next review
  const calculateNextReview = (
    review: CardReview | undefined,
    quality: number // 0-5 (0=complete blackout, 5=perfect response)
  ): CardReview => {
    const now = new Date();
    
    if (!review) {
      // First review
      return {
        cardId: 0, // Will be set by caller
        easeFactor: 2.5,
        interval: quality >= 3 ? 1 : 0,
        repetitions: quality >= 3 ? 1 : 0,
        nextReview: new Date(now.getTime() + (quality >= 3 ? 24 * 60 * 60 * 1000 : 10 * 60 * 1000)),
        lastReviewed: now,
        totalReviews: 1,
        correctCount: quality >= 3 ? 1 : 0,
        incorrectCount: quality < 3 ? 1 : 0,
      };
    }

    let { easeFactor, interval, repetitions } = review;
    
    // Update ease factor
    easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

    // Update repetitions and interval
    if (quality < 3) {
      repetitions = 0;
      interval = 1;
    } else {
      repetitions += 1;
      if (repetitions === 1) {
        interval = 1;
      } else if (repetitions === 2) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
    }

    const nextReviewDate = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

    return {
      ...review,
      easeFactor,
      interval,
      repetitions,
      nextReview: nextReviewDate,
      lastReviewed: now,
      totalReviews: review.totalReviews + 1,
      correctCount: review.correctCount + (quality >= 3 ? 1 : 0),
      incorrectCount: review.incorrectCount + (quality < 3 ? 1 : 0),
    };
  };

  // Handle difficulty response in study mode
  const handleDifficultyResponse = (response: DifficultyResponse) => {
    const currentCard = filteredAndOrderedCards[currentCardIndex];
    if (!currentCard) return;

    const qualityMap = {
      again: 0,
      hard: 3,
      good: 4,
      easy: 5,
    };

    const quality = qualityMap[response];
    const currentReview = cardReviews.get(currentCard.id);
    const newReview = calculateNextReview(currentReview, quality);
    newReview.cardId = currentCard.id;

    const newReviews = new Map(cardReviews);
    newReviews.set(currentCard.id, newReview);
    saveReviews(newReviews);

    // Update session stats
    setSessionTotal(prev => prev + 1);
    if (quality >= 3) {
      setSessionCorrect(prev => prev + 1);
      setStreak(prev => prev + 1);
      toast({
        title: "Correct! 🎉",
        description: `Next review in ${newReview.interval} day${newReview.interval > 1 ? 's' : ''}`,
      });
    } else {
      setStreak(0);
      toast({
        title: "Keep practicing!",
        description: "This card will appear again soon",
        variant: "destructive",
      });
    }

    // Move to next card
    setTimeout(() => {
      nextCard();
    }, 1000);
  };

  const createDeckMutation = useMutation({
    mutationFn: (data: DeckFormData) => apiRequest("POST", "/api/flashcard-decks", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flashcard-decks"] });
      setIsDeckDialogOpen(false);
      deckForm.reset();
      toast({
        title: "Deck created!",
        description: "Your new flashcard deck has been created",
      });
    },
  });

  const deleteDeckMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/flashcard-decks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flashcard-decks"] });
      setSelectedDeck(null);
      toast({
        title: "Deck deleted",
        description: "The deck has been removed",
      });
    },
  });

  const createCardMutation = useMutation({
    mutationFn: (data: FlashcardFormData) => apiRequest("POST", "/api/flashcards", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flashcards", selectedDeck?.id] });
      setIsCardDialogOpen(false);
      cardForm.reset();
      setEditingCard(null);
      toast({
        title: "Card added!",
        description: "Your flashcard has been created",
      });
    },
  });

  const updateCardMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<Flashcard>) =>
      apiRequest("PATCH", `/api/flashcards/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flashcards", selectedDeck?.id] });
      setIsCardDialogOpen(false);
      cardForm.reset();
      setEditingCard(null);
      toast({
        title: "Card updated!",
        description: "Your changes have been saved",
      });
    },
  });

  const deleteCardMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/flashcards/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flashcards", selectedDeck?.id] });
      toast({
        title: "Card deleted",
        description: "The flashcard has been removed",
      });
    },
  });

  const onDeckSubmit = (data: DeckFormData) => {
    createDeckMutation.mutate(data);
  };

  const onCardSubmit = (data: FlashcardFormData) => {
    if (editingCard) {
      updateCardMutation.mutate({ id: editingCard.id, ...data });
    } else {
      createCardMutation.mutate(data);
    }
  };

  // Import cards from CSV/text
  const handleImport = () => {
    if (!selectedDeck) return;
    
    const lines = importText.split('\n').filter(line => line.trim());
    let imported = 0;
    
    lines.forEach(line => {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 2) {
        createCardMutation.mutate({
          front: parts[0],
          back: parts[1],
          hint: parts[2] || "",
          tags: parts[3] || "",
          deckId: selectedDeck.id,
        });
        imported++;
      }
    });

    toast({
      title: "Import complete!",
      description: `Imported ${imported} flashcards`,
    });
    setImportText("");
    setIsImportDialogOpen(false);
  };

  // Export cards to CSV
  const handleExport = () => {
    const csv = flashcards.map(card => 
      `${card.front}|${card.back}|${(card as any).hint || ''}|${(card as any).tags || ''}`
    ).join('\n');
    
    const blob = new Blob([csv], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedDeck?.title || 'flashcards'}.txt`;
    a.click();
    
    toast({
      title: "Export complete!",
      description: "Your flashcards have been exported",
    });
  };

  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    flashcards.forEach(card => {
      const cardTags = (card as any).tags?.split(',').map((t: string) => t.trim()) || [];
      cardTags.forEach((tag: string) => tag && tags.add(tag));
    });
    return Array.from(tags);
  }, [flashcards]);

  // Filter and search cards
  const filteredAndOrderedCards = useMemo(() => {
    let filtered = flashcards.filter(card => {
      const matchesSearch = !searchQuery || 
        card.front.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.back.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTag = filterTag === "all" || 
        (card as any).tags?.includes(filterTag);

      return matchesSearch && matchesTag;
    });

    // Sort by review schedule if in study mode
    if (studyMode) {
      filtered = [...filtered].sort((a, b) => {
        const reviewA = cardReviews.get(a.id);
        const reviewB = cardReviews.get(b.id);
        
        if (!reviewA && !reviewB) return 0;
        if (!reviewA) return -1;
        if (!reviewB) return 1;
        
        return reviewA.nextReview.getTime() - reviewB.nextReview.getTime();
      });
    }

    if (shuffled && studyMode) {
      return [...filtered].sort(() => Math.random() - 0.5);
    }

    return filtered;
  }, [flashcards, searchQuery, filterTag, shuffled, studyMode, cardReviews]);

  // Cards due for review
  const dueCards = useMemo(() => {
    return flashcards.filter(card => {
      const review = cardReviews.get(card.id);
      if (!review) return true; // Never reviewed
      return review.nextReview <= new Date();
    });
  }, [flashcards, cardReviews]);

  const startStudy = (mode: StudyMode = "flip") => {
    if (filteredAndOrderedCards.length > 0) {
      setStudyMode(true);
      setStudyModeType(mode);
      setCurrentCardIndex(0);
      setShowAnswer(false);
      setSessionCorrect(0);
      setSessionTotal(0);
      setStreak(0);
      setUserAnswer("");
    }
  };

  const nextCard = () => {
    if (currentCardIndex < filteredAndOrderedCards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setShowAnswer(false);
      setUserAnswer("");
    } else {
      // End of session
      toast({
        title: "Session Complete! 🎉",
        description: `You got ${sessionCorrect} out of ${sessionTotal} correct`,
      });
      setStudyMode(false);
    }
  };

  const previousCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1);
      setShowAnswer(false);
      setUserAnswer("");
    }
  };

  const openCardDialog = (card?: Flashcard) => {
    if (card) {
      setEditingCard(card);
      cardForm.setValue("front", card.front);
      cardForm.setValue("back", card.back);
      cardForm.setValue("deckId", card.deckId);
      cardForm.setValue("hint", (card as any).hint || "");
      cardForm.setValue("tags", (card as any).tags || "");
      cardForm.setValue("difficulty", (card as any).difficulty || "medium");
    } else {
      setEditingCard(null);
      cardForm.reset();
      cardForm.setValue("deckId", selectedDeck?.id || 0);
    }
    setIsCardDialogOpen(true);
  };

  const checkTypedAnswer = () => {
    const currentCard = filteredAndOrderedCards[currentCardIndex];
    const correct = userAnswer.trim().toLowerCase() === currentCard.back.trim().toLowerCase();
    
    if (correct) {
      handleDifficultyResponse("good");
    } else {
      handleDifficultyResponse("again");
      setShowAnswer(true);
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const totalCards = flashcards.length;
    const reviewedCards = flashcards.filter(card => cardReviews.has(card.id)).length;
    const masteredCards = flashcards.filter(card => {
      const review = cardReviews.get(card.id);
      return review && review.repetitions >= 3 && review.easeFactor > 2.5;
    }).length;
    
    const totalReviews = Array.from(cardReviews.values()).reduce((sum, r) => sum + r.totalReviews, 0);
    const totalCorrect = Array.from(cardReviews.values()).reduce((sum, r) => sum + r.correctCount, 0);
    const accuracy = totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0;

    return {
      totalCards,
      reviewedCards,
      masteredCards,
      dueCards: dueCards.length,
      totalReviews,
      accuracy,
    };
  }, [flashcards, cardReviews, dueCards]);

  if (decksLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Study Mode Render
  if (studyMode && selectedDeck && filteredAndOrderedCards.length > 0) {
    const currentCard = filteredAndOrderedCards[currentCardIndex];
    const progress = ((currentCardIndex) / filteredAndOrderedCards.length) * 100;
    const cardReview = cardReviews.get(currentCard.id);
    
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header with Stats */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => setStudyMode(false)}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Exit
              </Button>
              <h2 className="text-xl font-bold">{selectedDeck.title}</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5" />
                <span className="font-bold">{streak}</span>
              </div>
              <div className="text-sm">
                {sessionCorrect}/{sessionTotal} correct
              </div>
            </div>
          </div>
          <Progress value={progress} className="h-2 bg-white/20" />
          <div className="flex justify-between items-center mt-2 text-sm">
            <span>Card {currentCardIndex + 1} of {filteredAndOrderedCards.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
        </div>

        {/* Main Card */}
        <Card className="min-h-[500px] relative overflow-hidden">
          <div className="absolute top-4 right-4 flex gap-2">
            <Badge variant="outline">
              {studyModeType === "flip" && <Eye className="w-3 h-3 mr-1" />}
              {studyModeType === "quiz" && <ListChecks className="w-3 h-3 mr-1" />}
              {studyModeType === "type" && <Edit className="w-3 h-3 mr-1" />}
              {studyModeType}
            </Badge>
            {cardReview && (
              <Badge variant="secondary">
                <Clock className="w-3 h-3 mr-1" />
                {cardReview.repetitions} reps
              </Badge>
            )}
          </div>

          <CardContent className="flex flex-col justify-center items-center p-12 min-h-[500px]">
            <div className="text-center space-y-6 w-full max-w-2xl">
              {/* Question */}
              <div>
                <Badge className="mb-4">Question</Badge>
                <div className="text-2xl md:text-3xl font-medium text-slate-900 leading-relaxed">
                  {currentCard.front}
                </div>
                {(currentCard as any).hint && !showAnswer && (
                  <div className="mt-4 text-sm text-slate-500 italic flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Hint: {(currentCard as any).hint}
                  </div>
                )}
              </div>

              <Separator />

              {/* Answer Section */}
              {studyModeType === "flip" && (
                <div className="space-y-4">
                  {showAnswer ? (
                    <div>
                      <Badge className="mb-4 bg-green-500">Answer</Badge>
                      <div className="text-xl md:text-2xl text-slate-700 leading-relaxed">
                        {currentCard.back}
                      </div>
                      
                      {/* Difficulty Buttons */}
                      <div className="grid grid-cols-4 gap-2 mt-8">
                        <Button
                          variant="outline"
                          className="flex-col h-auto py-4 border-red-300 hover:bg-red-50"
                          onClick={() => handleDifficultyResponse("again")}
                        >
                          <XCircle className="w-5 h-5 mb-1 text-red-500" />
                          <span className="text-xs">Again</span>
                          <span className="text-xs text-slate-500">{"<10m"}</span>
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-col h-auto py-4 border-orange-300 hover:bg-orange-50"
                          onClick={() => handleDifficultyResponse("hard")}
                        >
                          <AlertCircle className="w-5 h-5 mb-1 text-orange-500" />
                          <span className="text-xs">Hard</span>
                          <span className="text-xs text-slate-500">1d</span>
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-col h-auto py-4 border-blue-300 hover:bg-blue-50"
                          onClick={() => handleDifficultyResponse("good")}
                        >
                          <CheckCircle2 className="w-5 h-5 mb-1 text-blue-500" />
                          <span className="text-xs">Good</span>
                          <span className="text-xs text-slate-500">
                            {cardReview ? `${Math.round(cardReview.interval * 2.5)}d` : "1d"}
                          </span>
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-col h-auto py-4 border-green-300 hover:bg-green-50"
                          onClick={() => handleDifficultyResponse("easy")}
                        >
                          <Sparkles className="w-5 h-5 mb-1 text-green-500" />
                          <span className="text-xs">Easy</span>
                          <span className="text-xs text-slate-500">
                            {cardReview ? `${Math.round(cardReview.interval * 3)}d` : "4d"}
                          </span>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button 
                      onClick={() => setShowAnswer(true)} 
                      size="lg"
                      className="w-full max-w-md"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Show Answer
                    </Button>
                  )}
                </div>
              )}

              {studyModeType === "type" && (
                <div className="space-y-4">
                  {!showAnswer ? (
                    <div>
                      <Input
                        placeholder="Type your answer..."
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && checkTypedAnswer()}
                        className="text-lg p-6 text-center"
                        autoFocus
                      />
                      <Button 
                        onClick={checkTypedAnswer}
                        size="lg"
                        className="w-full max-w-md mt-4"
                        disabled={!userAnswer.trim()}
                      >
                        Check Answer
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <div className="mb-4">
                        <Badge className="bg-green-500 mb-2">Correct Answer</Badge>
                        <div className="text-xl text-slate-700">{currentCard.back}</div>
                      </div>
                      <div className="mb-4">
                        <Badge variant="outline" className="mb-2">Your Answer</Badge>
                        <div className="text-xl text-red-600">{userAnswer}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>

          {/* Navigation */}
          <CardFooter className="justify-between border-t">
            <Button
              variant="outline"
              onClick={previousCard}
              disabled={currentCardIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            
            {showAnswer && studyModeType !== "flip" && (
              <Button onClick={nextCard}>
                Next Card
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Deck View
  if (selectedDeck) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSelectedDeck(null)}
              className="mb-2"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Decks
            </Button>
            <h2 className="text-3xl font-bold text-slate-900">{selectedDeck.title}</h2>
            {selectedDeck.description && (
              <p className="text-slate-600 mt-1">{selectedDeck.description}</p>
            )}
            {(selectedDeck as any).tags && (
              <div className="flex gap-2 mt-2">
                {(selectedDeck as any).tags.split(',').map((tag: string, i: number) => (
                  <Badge key={i} variant="outline">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag.trim()}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Stats Card */}
          <Card className="min-w-[200px]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Total Cards:</span>
                <span className="font-bold">{stats.totalCards}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Due Today:</span>
                <span className="font-bold text-orange-600">{stats.dueCards}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Mastered:</span>
                <span className="font-bold text-green-600">{stats.masteredCards}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Accuracy:</span>
                <span className="font-bold">{stats.accuracy}%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={() => startStudy("flip")}
            disabled={filteredAndOrderedCards.length === 0}
            className="bg-gradient-to-r from-blue-500 to-purple-600"
          >
            <Brain className="w-4 h-4 mr-2" />
            Study Now ({dueCards.length} due)
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Zap className="w-4 h-4 mr-2" />
                Study Modes
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Choose Study Mode</DialogTitle>
                <DialogDescription>Select how you want to study your flashcards</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <Button
                  variant="outline"
                  className="justify-start h-auto py-4"
                  onClick={() => {
                    startStudy("flip");
                  }}
                >
                  <div className="flex items-start gap-3 text-left">
                    <Eye className="w-5 h-5 mt-1" />
                    <div>
                      <div className="font-semibold">Flip Cards</div>
                      <div className="text-sm text-slate-600">Classic flashcard flipping with spaced repetition</div>
                    </div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start h-auto py-4"
                  onClick={() => startStudy("type")}
                >
                  <div className="flex items-start gap-3 text-left">
                    <Edit className="w-5 h-5 mt-1" />
                    <div>
                      <div className="font-semibold">Type Answer</div>
                      <div className="text-sm text-slate-600">Type the answer to test recall</div>
                    </div>
                  </div>
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            onClick={() => setShuffled(!shuffled)}
          >
            <Shuffle className={`w-4 h-4 mr-2 ${shuffled ? 'text-blue-500' : ''}`} />
            {shuffled ? 'Shuffled' : 'Shuffle'}
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsStatsDialogOpen(true)}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Statistics
          </Button>

          <Dialog open={isCardDialogOpen} onOpenChange={setIsCardDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openCardDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Card
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingCard ? "Edit Flashcard" : "Add New Flashcard"}
                </DialogTitle>
              </DialogHeader>
              <Form {...cardForm}>
                <form onSubmit={cardForm.handleSubmit(onCardSubmit)} className="space-y-4">
                  <FormField
                    control={cardForm.control}
                    name="front"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Front (Question)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter the question..." 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={cardForm.control}
                    name="back"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Back (Answer)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter the answer..." 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={cardForm.control}
                    name="hint"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hint (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Add a hint..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={cardForm.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tags (comma-separated)</FormLabel>
                          <FormControl>
                            <Input placeholder="biology, chapter1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={cardForm.control}
                      name="difficulty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Difficulty</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select difficulty" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="easy">Easy</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="hard">Hard</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCardDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createCardMutation.isPending || updateCardMutation.isPending}
                    >
                      {createCardMutation.isPending || updateCardMutation.isPending
                        ? "Saving..." 
                        : editingCard ? "Update Card" : "Add Card"
                      }
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Flashcards</DialogTitle>
                <DialogDescription>
                  Paste your flashcards (one per line, format: Front | Back | Hint | Tags)
                </DialogDescription>
              </DialogHeader>
              <Textarea
                placeholder="What is React? | A JavaScript library | | programming&#10;What is TypeScript? | JavaScript with types | | programming"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleImport} disabled={!importText.trim()}>
                  Import {importText.split('\n').filter(l => l.trim()).length} Cards
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search flashcards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {allTags.length > 0 && (
            <Select value={filterTag} onValueChange={setFilterTag}>
              <SelectTrigger className="w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {allTags.map(tag => (
                  <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Cards Grid */}
        {cardsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filteredAndOrderedCards.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <div className="text-slate-400 text-lg mb-2">
                {flashcards.length === 0 
                  ? "No flashcards in this deck yet"
                  : "No cards match your search"
                }
              </div>
              {flashcards.length === 0 && (
                <Button 
                  onClick={() => openCardDialog()}
                  variant="outline"
                  className="mt-4"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add your first flashcard
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndOrderedCards.map((card) => {
              const review = cardReviews.get(card.id);
              const isDue = !review || review.nextReview <= new Date();
              
              return (
                <Card 
                  key={card.id} 
                  className={`hover:shadow-lg transition-all ${
                    isDue ? 'border-orange-300 bg-orange-50/50' : ''
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-2">
                        <Badge variant="outline" className="text-xs">
                          Question
                        </Badge>
                        <p className="text-sm font-medium text-slate-900 line-clamp-3">
                          {card.front}
                        </p>
                      </div>
                      {review && review.repetitions >= 3 && (
                        <Trophy className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3 pb-3">
                    <div>
                      <Badge variant="secondary" className="text-xs mb-2">
                        Answer
                      </Badge>
                      <p className="text-sm text-slate-600 line-clamp-2">{card.back}</p>
                    </div>
                    
                    {(card as any).tags && (
                      <div className="flex flex-wrap gap-1">
                        {(card as any).tags.split(',').map((tag: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {tag.trim()}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {review && (
                      <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t">
                        <Clock className="w-3 h-3" />
                        {isDue ? (
                          <span className="text-orange-600 font-medium">Due for review</span>
                        ) : (
                          <span>Next: {format(review.nextReview, 'MMM dd')}</span>
                        )}
                        <span className="ml-auto">
                          {review.correctCount}/{review.totalReviews}
                        </span>
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="pt-3 border-t flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openCardDialog(card)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteCardMutation.mutate(card.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        {/* Statistics Dialog */}
        <Dialog open={isStatsDialogOpen} onOpenChange={setIsStatsDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Deck Statistics
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Cards</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalCards}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Due Today</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">{stats.dueCards}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Mastered</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{stats.masteredCards}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Accuracy</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{stats.accuracy}%</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Learning Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600">Cards Reviewed</span>
                    <span className="font-medium">{stats.reviewedCards}/{stats.totalCards}</span>
                  </div>
                  <Progress value={(stats.reviewedCards / stats.totalCards) * 100 || 0} />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600">Mastery Level</span>
                    <span className="font-medium">{stats.masteredCards}/{stats.totalCards}</span>
                  </div>
                  <Progress 
                    value={(stats.masteredCards / stats.totalCards) * 100 || 0}
                    className="[&>div]:bg-green-500"
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-slate-600">Total Correct:</span>
                    <span className="font-bold ml-auto">
                      {Array.from(cardReviews.values()).reduce((sum, r) => sum + r.correctCount, 0)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span className="text-slate-600">Total Incorrect:</span>
                    <span className="font-bold ml-auto">
                      {Array.from(cardReviews.values()).reduce((sum, r) => sum + r.incorrectCount, 0)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-500" />
                    <span className="text-slate-600">Total Reviews:</span>
                    <span className="font-bold ml-auto">{stats.totalReviews}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-purple-500" />
                    <span className="text-slate-600">Avg. Ease:</span>
                    <span className="font-bold ml-auto">
                      {cardReviews.size > 0
                        ? (Array.from(cardReviews.values()).reduce((sum, r) => sum + r.easeFactor, 0) / cardReviews.size).toFixed(2)
                        : "N/A"
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Decks Overview
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Brain className="w-8 h-8 text-blue-500" />
            Smart Flashcards
          </h2>
          <p className="text-slate-600 mt-1">
            Advanced spaced repetition learning system
          </p>
        </div>
        <Dialog open={isDeckDialogOpen} onOpenChange={setIsDeckDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Plus className="w-5 h-5 mr-2" />
              New Deck
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Deck</DialogTitle>
              <DialogDescription>
                Start a new flashcard deck for studying
              </DialogDescription>
            </DialogHeader>
            <Form {...deckForm}>
              <form onSubmit={deckForm.handleSubmit(onDeckSubmit)} className="space-y-4">
                <FormField
                  control={deckForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Spanish Vocabulary" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={deckForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="What is this deck about?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={deckForm.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags (comma-separated)</FormLabel>
                      <FormControl>
                        <Input placeholder="language, spanish, beginner" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={deckForm.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a color" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DECK_COLORS.map(color => (
                            <SelectItem key={color.value} value={color.value}>
                              <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded ${color.class}`} />
                                {color.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDeckDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createDeckMutation.isPending}>
                    {createDeckMutation.isPending ? "Creating..." : "Create Deck"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Feature Highlights */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-semibold">Smart Algorithm</div>
                <div className="text-sm text-slate-600">SM-2 Spaced Repetition</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-semibold">Multiple Modes</div>
                <div className="text-sm text-slate-600">Flip, Quiz, Type & More</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-semibold">Track Progress</div>
                <div className="text-sm text-slate-600">Detailed Analytics</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-semibold">Import/Export</div>
                <div className="text-sm text-slate-600">Easy Data Transfer</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Decks Grid */}
      {decks.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="py-20 text-center">
            <BookOpen className="w-20 h-20 text-slate-300 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-slate-700 mb-2">
              No flashcard decks yet
            </h3>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              Create your first deck to start learning with our advanced spaced repetition system
            </p>
            <Button onClick={() => setIsDeckDialogOpen(true)} size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Deck
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks.map((deck) => {
            const deckColor = DECK_COLORS.find(c => c.value === (deck as any).color) || DECK_COLORS[0];
            
            return (
              <Card 
                key={deck.id} 
                className="hover:shadow-xl transition-all cursor-pointer group border-2 hover:border-blue-300"
                onClick={() => setSelectedDeck(deck)}
              >
                <div className={`h-2 ${deckColor.class} rounded-t-lg`} />
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">
                        {deck.title}
                      </CardTitle>
                      {deck.description && (
                        <CardDescription className="mt-2 line-clamp-2">
                          {deck.description}
                        </CardDescription>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this deck?')) {
                          deleteDeckMutation.mutate(deck.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {(deck as any).tags && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {(deck as any).tags.split(',').slice(0, 3).map((tag: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {tag.trim()}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <Separator />
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">0 cards</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">
                          {format(new Date(deck.createdAt || new Date()), "MMM dd")}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="bg-slate-50 border-t">
                  <Button 
                    variant="ghost" 
                    className="w-full group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDeck(deck);
                    }}
                  >
                    Open Deck
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
