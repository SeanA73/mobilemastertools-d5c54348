import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import Landing from "@/pages/landing";
import App from "@/pages/app";

export default function SmartRouter() {
  const [location, setLocation] = useLocation();
  const [hasCheckedData, setHasCheckedData] = useState(false);

  // Optimized: Check for existing data after initial render to avoid blocking
  useEffect(() => {
    // Only check if we're on root path and haven't checked yet
    if (location === "/" && !hasCheckedData) {
      // Use a lightweight check that doesn't block rendering
      const checkData = async () => {
        try {
          // Try to get user data first (lightweight)
          const userRes = await fetch("/api/auth/user", { credentials: "include" });
          
          if (userRes.ok) {
            // Check localStorage for quick redirect decision
            const storedTodos = localStorage.getItem("todos");
            const storedNotes = localStorage.getItem("notes");
            const storedHabits = localStorage.getItem("habits");
            
            const hasLocalData = storedTodos || storedNotes || storedHabits;
            
            if (hasLocalData) {
              setLocation("/app");
            } else {
              // Only if no local data, make a lightweight API call
              // This runs after render, so it doesn't block
              const [todosRes] = await Promise.allSettled([
                fetch("/api/todos", { credentials: "include" }).then(r => r.ok ? r.json() : [])
              ]);
              
              const todos = todosRes.status === "fulfilled" ? todosRes.value : [];
              if (Array.isArray(todos) && todos.length > 0) {
                setLocation("/app");
              }
            }
          }
        } catch (error) {
          // Silently fail - user can navigate manually
          console.debug("Data check failed:", error);
        } finally {
          setHasCheckedData(true);
        }
      };
      
      // Don't block - let the page render first
      checkData();
    }
  }, [location, hasCheckedData, setLocation]);

  // Show appropriate component based on route - no blocking
  if (location === "/") {
    return <Landing />;
  } else if (location === "/app") {
    return <App />;
  }

  return null;
}