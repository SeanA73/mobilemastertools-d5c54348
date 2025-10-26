import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";
import Landing from "@/pages/landing";
import App from "@/pages/app";

export default function SmartRouter() {
  const [location, setLocation] = useLocation();

  // Check if user has any existing data
  const { data: todos = [], isLoading: todosLoading } = useQuery({
    queryKey: ["/api/todos"],
    retry: false,
  });

  const { data: notes = [], isLoading: notesLoading } = useQuery({
    queryKey: ["/api/notes"],
    retry: false,
  });

  const { data: habits = [], isLoading: habitsLoading } = useQuery({
    queryKey: ["/api/habits"],
    retry: false,
  });

  const { data: voiceRecordings = [], isLoading: voiceLoading } = useQuery({
    queryKey: ["/api/voice-recordings"],
    retry: false,
  });

  const { data: flashcardDecks = [], isLoading: flashcardsLoading } = useQuery({
    queryKey: ["/api/flashcard-decks"],
    retry: false,
  });

  const isLoading = todosLoading || notesLoading || habitsLoading || voiceLoading || flashcardsLoading;

  useEffect(() => {
    // Only redirect if we're on the root path and not loading
    if (location === "/" && !isLoading) {
      const hasData = (Array.isArray(todos) && todos.length > 0) || 
                     (Array.isArray(notes) && notes.length > 0) || 
                     (Array.isArray(habits) && habits.length > 0) ||
                     (Array.isArray(voiceRecordings) && voiceRecordings.length > 0) ||
                     (Array.isArray(flashcardDecks) && flashcardDecks.length > 0);
      
      if (hasData) {
        setLocation("/app");
      }
    }
  }, [location, todos, notes, habits, voiceRecordings, flashcardDecks, isLoading, setLocation]);

  // Show loading state while checking data
  if (location === "/" && isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  // Show appropriate component based on route
  if (location === "/") {
    return <Landing />;
  } else if (location === "/app") {
    return <App />;
  }

  return null;
}