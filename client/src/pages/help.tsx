import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, Brain, Lock, Timer, Mic, Home, ChevronRight,
  CheckCircle2, Zap, Star, Target, Info, Lightbulb,
  Gift, Award, Trophy, Sparkles, ArrowLeft, ListChecks, FileText
} from "lucide-react";
import { Link } from "wouter";

export default function HelpPage() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  const tools = [
    {
      id: "todo",
      name: "Enhanced Todo Manager",
      icon: ListChecks,
      color: "indigo",
      description: "AI-powered task management with NLP and multiple views",
      features: [
        "Natural Language Processing - type tasks naturally",
        "4 powerful views (List, Kanban, Eisenhower Matrix, Calendar)",
        "Drag-and-drop task reordering and management",
        "Eisenhower Matrix for priority management",
        "Kanban board for workflow visualization",
        "Subtasks with unlimited nesting",
        "Priority, Urgency, and Importance ratings",
        "Categories, tags, and labels for organization",
        "Due dates, reminders, and time tracking",
        "Recurring tasks with flexible patterns",
        "Dependencies and blocked-by relationships",
        "Voice quick add for hands-free task creation",
        "Search, filter, and sort capabilities",
        "Custom fields for additional metadata",
        "localStorage support - works offline"
      ],
      howToUse: [
        { step: "Quick Add with NLP", desc: "Type naturally: 'Buy milk tomorrow #shopping @errands high priority'" },
        { step: "Auto-Parse", desc: "System extracts title, due date, tags, labels, and priority automatically" },
        { step: "Choose View", desc: "Switch between List, Kanban, Matrix, or Calendar based on your workflow" },
        { step: "Organize", desc: "Use Eisenhower Matrix to prioritize what matters most" },
        { step: "Execute", desc: "Work from Kanban board, dragging tasks through workflow" },
        { step: "Track", desc: "Check off tasks, track time, add notes as you progress" },
        { step: "Review", desc: "Filter by category, priority, or tags to review specific areas" }
      ],
      tips: [
        "Use NLP for quick task entry - it's much faster than forms",
        "Start each day in Eisenhower Matrix to prioritize",
        "Work from Kanban board for visual workflow management",
        "Use #tags for topics and @labels for context/location",
        "Break large tasks into subtasks for better tracking",
        "Set estimated durations to improve time awareness",
        "Review completed tasks weekly and archive them",
        "Use dependencies to track project task relationships"
      ]
    },
    {
      id: "notes",
      name: "Enhanced Notes Pro",
      icon: FileText,
      color: "orange",
      description: "Professional note-taking with rich text and markdown",
      features: [
        "TipTap rich text editor with full formatting",
        "Markdown support with live preview",
        "Folders for organization",
        "Templates for common note types",
        "Tags and smart tags for categorization",
        "Linked notes (bi-directional linking)",
        "Web clipper integration",
        "Quick capture mode",
        "Search and full-text search",
        "Grid and List views",
        "Archive and favorites",
        "Word count and reading time",
        "Export (Markdown, HTML, Text)",
        "Import from files",
        "Auto-save functionality",
        "localStorage support - works offline"
      ],
      howToUse: [
        { step: "Create Note", desc: "Click 'New Note' and enter a title" },
        { step: "Choose Editor", desc: "Select Rich Text for formatting or Markdown for plain text" },
        { step: "Write Content", desc: "Use the formatting toolbar for bold, italic, headings, lists, etc." },
        { step: "Add Metadata", desc: "Add tags, select folder, star if important" },
        { step: "Auto-Save", desc: "Note saves automatically - no manual save needed!" },
        { step: "Organize", desc: "Use folders and tags to categorize your notes" },
        { step: "Search", desc: "Find notes quickly using search or filter by tags/folders" }
      ],
      tips: [
        "Use Rich Text mode for formatted documents and presentations",
        "Switch to Markdown for quick note-taking and technical docs",
        "Create folders for major projects or subjects",
        "Tag notes with multiple tags for easy cross-referencing",
        "Star your most important or frequently accessed notes",
        "Use templates for meeting notes, journals, and recurring formats",
        "Export important notes regularly as backup",
        "Link related notes together to build a knowledge base"
      ]
    },
    {
      id: "flashcards",
      name: "Smart Flashcards",
      icon: Brain,
      color: "blue",
      description: "Advanced spaced repetition learning system",
      features: [
        "SM-2 spaced repetition algorithm for optimal learning",
        "Multiple study modes (Flip Cards, Type Answer)",
        "Detailed statistics and progress tracking",
        "Tags and categories for organization",
        "Import/Export functionality (CSV/JSON)",
        "Search and filter cards",
        "Difficulty ratings (Easy/Medium/Hard)",
        "Review schedule tracking",
        "Mastery indicators and achievements",
        "Persistent storage with localStorage"
      ],
      howToUse: [
        { step: "Create a Deck", desc: "Click 'New Deck' and give it a title, description, tags, and color" },
        { step: "Add Cards", desc: "Open the deck and click 'Add Card' to create flashcards" },
        { step: "Fill Card Details", desc: "Enter question (front), answer (back), optional hint, tags, and difficulty" },
        { step: "Start Studying", desc: "Click 'Study Now' to begin learning with spaced repetition" },
        { step: "Rate Your Response", desc: "After each card, click Again/Hard/Good/Easy based on how well you knew it" },
        { step: "Track Progress", desc: "View Statistics to see your learning progress and mastery level" }
      ],
      tips: [
        "Study cards daily for best results - consistency is key!",
        "Be honest with difficulty ratings - it helps the algorithm optimize",
        "Use hints sparingly for complex topics only",
        "Tag cards by chapter, topic, or difficulty for easy filtering",
        "Check Statistics weekly to track your progress",
        "Import/Export to backup your decks regularly"
      ]
    },
    {
      id: "password",
      name: "Password Generator Pro",
      icon: Lock,
      color: "green",
      description: "Generate ultra-secure passwords with advanced analysis",
      features: [
        "5 generation modes (Random, Memorable, Passphrase, PIN, Pattern)",
        "Cryptographically secure generation",
        "Real-time password strength analyzer",
        "Entropy calculation and crack time estimation",
        "Common password breach checking",
        "6 quick templates (Website, Banking, Email, WiFi, Database, Admin)",
        "Bulk generation (1-100 passwords)",
        "Password history (last 20 generated)",
        "Export to JSON format",
        "Custom character sets and patterns"
      ],
      howToUse: [
        { step: "Choose Mode", desc: "Select from Random, Memorable, Passphrase, PIN, or Pattern tabs" },
        { step: "Adjust Settings", desc: "Set length, character types, and options for your needs" },
        { step: "Use Templates", desc: "Click 'Templates' for quick presets (Website, Banking, etc.)" },
        { step: "Generate", desc: "Click 'Generate Password' to create a secure password" },
        { step: "Check Strength", desc: "Review the strength analysis, entropy, and crack time" },
        { step: "Copy & Use", desc: "Click the copy button to copy password to clipboard" }
      ],
      tips: [
        "Use 16+ characters for important accounts",
        "Passphrases are easier to remember and still very secure",
        "Banking/Admin accounts should use 20-32 character passwords",
        "WiFi passwords work best with Passphrase mode (easy to share verbally)",
        "Check the breach warning - never use common passwords",
        "Use Bulk Generation for setting up multiple accounts at once"
      ]
    },
    {
      id: "pomodoro",
      name: "Pomodoro Pro",
      icon: Timer,
      color: "red",
      description: "Advanced focus timer with analytics",
      features: [
        "4 timer presets (Classic, Short Sprint, Deep Focus, Ultra Focus)",
        "Focus Mode (fullscreen immersive timer)",
        "Task integration (track what you're working on)",
        "Comprehensive statistics dashboard",
        "Complete session history with status tracking",
        "5 sound themes (Default, Gentle, Bell, Chime, Silent)",
        "Browser desktop notifications",
        "Auto-start options for breaks and work sessions",
        "Daily goals and streak tracking",
        "Weekly overview with progress bars",
        "Data export (JSON) and history management",
        "Customizable durations and cycle settings"
      ],
      howToUse: [
        { step: "Select Preset", desc: "Choose Classic (25/5/15), Short Sprint, Deep Focus, or Ultra Focus" },
        { step: "Set Task", desc: "Enter what you're working on (optional but recommended)" },
        { step: "Start Timer", desc: "Click 'Start' to begin your focus session" },
        { step: "Work Focused", desc: "Concentrate on your task until the timer rings" },
        { step: "Take Break", desc: "When timer completes, take your scheduled break" },
        { step: "Repeat Cycle", desc: "Complete 4 sessions, then take a longer break" },
        { step: "Review Stats", desc: "Check Statistics tab to see your productivity trends" }
      ],
      tips: [
        "Start with Classic (25/5/15) if you're new to Pomodoro",
        "Use Deep Focus (50/10/30) for complex coding or design work",
        "Always take real breaks - step away from your screen",
        "Enable Focus Mode for maximum concentration",
        "Set a realistic daily goal (4-8 sessions for beginners)",
        "Review your Weekly Overview every Sunday to track progress"
      ]
    },
    {
      id: "voice",
      name: "Voice Recorder Pro",
      icon: Mic,
      color: "purple",
      description: "Professional audio recording with transcription",
      features: [
        "Record audio with pause/resume controls",
        "Live transcription in 20 languages",
        "Save recordings with localStorage (no database needed)",
        "Play recordings with audio controls",
        "Generate transcripts post-recording",
        "AI-powered summary generation",
        "Search recordings by title, transcript, or tags",
        "Share via Email, WhatsApp, SMS, Telegram, social media",
        "Export as Audio (WAV), Text (.txt), or Markdown (.md)",
        "Delete recordings easily",
        "Persistent storage (survives page refresh)",
        "High-quality audio settings (noise suppression, echo cancellation)"
      ],
      howToUse: [
        { step: "Select Language", desc: "Choose your transcription language from 20+ options" },
        { step: "Start Recording", desc: "Click 'Start Recording' and allow microphone access" },
        { step: "Speak Clearly", desc: "Speak into your microphone - watch live transcription appear" },
        { step: "Pause if Needed", desc: "Use pause button to temporarily stop recording" },
        { step: "Stop Recording", desc: "Click 'Stop' when finished" },
        { step: "Save with Title", desc: "Enter a descriptive title and click 'Save Recording'" },
        { step: "Playback & Share", desc: "Use play button to listen, share or export as needed" }
      ],
      tips: [
        "Use a quiet environment for best transcription accuracy",
        "Speak clearly and at a moderate pace",
        "Pause recording during interruptions instead of stopping",
        "Generate transcripts immediately after recording for best results",
        "Use AI Summary for long recordings to get quick overview",
        "Export important recordings to backup your audio files",
        "Search works on transcript text - making recordings searchable!"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/app">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to App
            </Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <Home className="w-4 h-4" />
              Home
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Help & User Guide
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Learn how to master all the enhanced productivity tools in MobileToolsBox
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-blue-600">6</div>
              <div className="text-sm text-slate-600">Enhanced Tools</div>
            </CardContent>
          </Card>
          <Card className="border-purple-200 bg-purple-50/50">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-purple-600">79+</div>
              <div className="text-sm text-slate-600">Features</div>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-600">100%</div>
              <div className="text-sm text-slate-600">Free Forever</div>
            </CardContent>
          </Card>
          <Card className="border-orange-200 bg-orange-50/50">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-orange-600">0</div>
              <div className="text-sm text-slate-600">Database Required</div>
            </CardContent>
          </Card>
        </div>

        {/* Tools Overview */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl">Enhanced Productivity Tools</CardTitle>
            <CardDescription>Click on any tool to learn more about its features and how to use it</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {tools.map((tool) => {
                const IconComponent = tool.icon;
                return (
                  <Card 
                    key={tool.id}
                    className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-blue-300"
                    onClick={() => setSelectedTool(tool.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={
                            tool.color === "indigo" ? "p-3 bg-indigo-100 rounded-lg" :
                            tool.color === "orange" ? "p-3 bg-orange-100 rounded-lg" :
                            tool.color === "blue" ? "p-3 bg-blue-100 rounded-lg" :
                            tool.color === "green" ? "p-3 bg-green-100 rounded-lg" :
                            tool.color === "red" ? "p-3 bg-red-100 rounded-lg" :
                            "p-3 bg-purple-100 rounded-lg"
                          }>
                            <IconComponent className={
                              tool.color === "indigo" ? "w-6 h-6 text-indigo-600" :
                              tool.color === "orange" ? "w-6 h-6 text-orange-600" :
                              tool.color === "blue" ? "w-6 h-6 text-blue-600" :
                              tool.color === "green" ? "w-6 h-6 text-green-600" :
                              tool.color === "red" ? "w-6 h-6 text-red-600" :
                              "w-6 h-6 text-purple-600"
                            } />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{tool.name}</CardTitle>
                            <CardDescription className="text-sm">{tool.description}</CardDescription>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{tool.features.length} features</Badge>
                        <Badge variant="outline">{tool.howToUse.length} steps</Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Detailed Tool Guides */}
        {tools.map((tool) => {
          const IconComponent = tool.icon;
          return (
            <Card key={tool.id} id={tool.id} className="border-2">
              <CardHeader className={
                tool.color === "indigo" ? "bg-gradient-to-r from-indigo-50 to-indigo-100/50" :
                tool.color === "orange" ? "bg-gradient-to-r from-orange-50 to-orange-100/50" :
                tool.color === "blue" ? "bg-gradient-to-r from-blue-50 to-blue-100/50" :
                tool.color === "green" ? "bg-gradient-to-r from-green-50 to-green-100/50" :
                tool.color === "red" ? "bg-gradient-to-r from-red-50 to-red-100/50" :
                "bg-gradient-to-r from-purple-50 to-purple-100/50"
              }>
                <div className="flex items-center gap-3 mb-2">
                  <div className={
                    tool.color === "indigo" ? "p-3 bg-indigo-500 rounded-lg" :
                    tool.color === "orange" ? "p-3 bg-orange-500 rounded-lg" :
                    tool.color === "blue" ? "p-3 bg-blue-500 rounded-lg" :
                    tool.color === "green" ? "p-3 bg-green-500 rounded-lg" :
                    tool.color === "red" ? "p-3 bg-red-500 rounded-lg" :
                    "p-3 bg-purple-500 rounded-lg"
                  }>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{tool.name}</CardTitle>
                    <CardDescription className="text-base">{tool.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <Tabs defaultValue="features" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="features">
                      <Star className="w-4 h-4 mr-2" />
                      Features
                    </TabsTrigger>
                    <TabsTrigger value="tutorial">
                      <Target className="w-4 h-4 mr-2" />
                      How to Use
                    </TabsTrigger>
                    <TabsTrigger value="tips">
                      <Lightbulb className="w-4 h-4 mr-2" />
                      Pro Tips
                    </TabsTrigger>
                  </TabsList>

                  {/* Features Tab */}
                  <TabsContent value="features" className="space-y-4 mt-6">
                    <div className="grid gap-3">
                      {tool.features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                          <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Tutorial Tab */}
                  <TabsContent value="tutorial" className="space-y-4 mt-6">
                    <div className="space-y-4">
                      {tool.howToUse.map((step, index) => (
                        <div key={index} className="flex gap-4">
                          <div className={
                            tool.color === "indigo" ? "flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold" :
                            tool.color === "orange" ? "flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold" :
                            tool.color === "blue" ? "flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold" :
                            tool.color === "green" ? "flex-shrink-0 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold" :
                            tool.color === "red" ? "flex-shrink-0 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center font-bold" :
                            "flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold"
                          }>
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900 mb-1">{step.step}</h4>
                            <p className="text-slate-600 text-sm">{step.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Tips Tab */}
                  <TabsContent value="tips" className="space-y-4 mt-6">
                    <div className="grid gap-3">
                      {tool.tips.map((tip, index) => (
                        <div key={index} className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                          <Lightbulb className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-700">{tip}</span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          );
        })}

        {/* General Tips */}
        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-blue-600" />
              General Best Practices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Productivity Tips
                </h4>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Use Pomodoro Timer while studying flashcards for focused learning sessions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Generate secure passwords for all your accounts - never reuse!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Record meeting notes with Voice Recorder for easy reference</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Track your learning progress with Flashcard statistics</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Pro User Strategies
                </h4>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Combine tools: Record lectures, transcribe, create flashcards from transcript</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Set daily goals: 4 pomodoros + 20 flashcards = productive day</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Export data regularly as backup (all tools support export)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Review statistics weekly to optimize your productivity habits</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data & Privacy */}
        <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-6 h-6 text-green-600" />
              Data & Privacy Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-green-900 mb-2">Local Storage</h4>
                <p className="text-slate-700">
                  All enhanced tools use localStorage to save your data directly in your browser. 
                  No server required, complete privacy!
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-green-900 mb-2">Your Data, Your Control</h4>
                <p className="text-slate-700">
                  Export your data anytime. Clear your data anytime. 
                  Everything stays on your device unless you explicitly share it.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-green-900 mb-2">Offline Capable</h4>
                <p className="text-slate-700">
                  All tools work offline after initial load. 
                  Perfect for studying, traveling, or areas with poor connectivity.
                </p>
              </div>
            </div>

            <Separator />

            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-3">Data Storage by Tool:</h4>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-blue-500" />
                  <span className="text-slate-700"><strong>Flashcards:</strong> Review data in localStorage</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-green-500" />
                  <span className="text-slate-700"><strong>Password Gen:</strong> History only (no storage)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-red-500" />
                  <span className="text-slate-700"><strong>Pomodoro:</strong> Sessions in localStorage</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-purple-500" />
                  <span className="text-slate-700"><strong>Voice Recorder:</strong> Audio in localStorage</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Start Guide */}
        <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-600" />
              Quick Start Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-purple-600" />
                  First Time User? Start Here!
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">1</div>
                      <h4 className="font-semibold">Try Flashcards</h4>
                    </div>
                    <p className="text-sm text-slate-600 ml-10">
                      Create a deck, add 5-10 cards on a topic you want to learn, and study them. 
                      Experience the spaced repetition magic!
                    </p>
                  </div>

                  <div className="p-4 bg-white rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm">2</div>
                      <h4 className="font-semibold">Generate Passwords</h4>
                    </div>
                    <p className="text-sm text-slate-600 ml-10">
                      Click Password Generator, try the "Passphrase" mode, and generate an easy-to-remember 
                      but secure password!
                    </p>
                  </div>

                  <div className="p-4 bg-white rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-sm">3</div>
                      <h4 className="font-semibold">Focus Session</h4>
                    </div>
                    <p className="text-sm text-slate-600 ml-10">
                      Open Pomodoro Timer, select "Classic" preset, set a task, and complete your first 
                      25-minute focus session!
                    </p>
                  </div>

                  <div className="p-4 bg-white rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-sm">4</div>
                      <h4 className="font-semibold">Voice Note</h4>
                    </div>
                    <p className="text-sm text-slate-600 ml-10">
                      Try Voice Recorder to record a quick voice note. Watch the live transcription 
                      and save it for later!
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  Recommended Workflows
                </h3>
                <div className="space-y-3">
                  <div className="p-4 bg-white rounded-lg border">
                    <h4 className="font-semibold mb-2">📚 For Students</h4>
                    <p className="text-sm text-slate-600">
                      <strong>Morning:</strong> Create flashcards from lecture notes → 
                      <strong>Afternoon:</strong> Use Pomodoro to study (4 sessions) → 
                      <strong>Evening:</strong> Review flashcards due today → 
                      <strong>Track:</strong> Check statistics for progress
                    </p>
                  </div>

                  <div className="p-4 bg-white rounded-lg border">
                    <h4 className="font-semibold mb-2">💼 For Professionals</h4>
                    <p className="text-sm text-slate-600">
                      <strong>Meetings:</strong> Record with Voice Recorder → 
                      <strong>Work:</strong> Deep Focus Pomodoro (50/10/30) → 
                      <strong>Learning:</strong> Flashcards for new skills → 
                      <strong>Security:</strong> Generate unique passwords for all accounts
                    </p>
                  </div>

                  <div className="p-4 bg-white rounded-lg border">
                    <h4 className="font-semibold mb-2">🎯 For Language Learners</h4>
                    <p className="text-sm text-slate-600">
                      <strong>Create:</strong> Vocabulary flashcard decks by theme → 
                      <strong>Practice:</strong> Daily study sessions with spaced repetition → 
                      <strong>Record:</strong> Practice speaking and pronunciation → 
                      <strong>Review:</strong> Track mastery in statistics
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-6 h-6 text-blue-600" />
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-semibold text-slate-900 mb-2">Q: Do I need a database to use these tools?</h4>
                <p className="text-sm text-slate-600">
                  <strong>A:</strong> No! All enhanced tools work perfectly with localStorage. 
                  Your data is saved in your browser and persists across sessions. 
                  No database configuration needed!
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-semibold text-slate-900 mb-2">Q: Will my data be lost if I clear my browser?</h4>
                <p className="text-sm text-slate-600">
                  <strong>A:</strong> Yes, clearing browser data will remove localStorage. 
                  We recommend exporting important data regularly. All tools have export functionality!
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-semibold text-slate-900 mb-2">Q: How does the spaced repetition algorithm work?</h4>
                <p className="text-sm text-slate-600">
                  <strong>A:</strong> We use the SM-2 algorithm which calculates optimal review times based on your performance. 
                  Cards you find easy are shown less often, while difficult cards appear more frequently.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-semibold text-slate-900 mb-2">Q: Are the passwords truly secure?</h4>
                <p className="text-sm text-slate-600">
                  <strong>A:</strong> Yes! We use <code>crypto.getRandomValues()</code> which is cryptographically secure. 
                  All generation happens locally in your browser - passwords never touch a server.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-semibold text-slate-900 mb-2">Q: Can I use Voice Recorder offline?</h4>
                <p className="text-sm text-slate-600">
                  <strong>A:</strong> Yes! Once the page loads, you can record offline. 
                  Live transcription requires internet, but basic recording works without connectivity.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-semibold text-slate-900 mb-2">Q: How do I backup my data?</h4>
                <p className="text-sm text-slate-600">
                  <strong>A:</strong> Each tool has an Export function:
                  <br/>• Flashcards: Export decks as CSV
                  <br/>• Pomodoro: Export data as JSON
                  <br/>• Voice Recorder: Export audio and transcripts
                  <br/>• Password Gen: Export bulk passwords as JSON
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support Section */}
        <Card className="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
          <CardHeader>
            <CardTitle>Need More Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-slate-700 mb-2">
                  Love MobileToolsBox? Consider supporting development to keep it free for everyone!
                </p>
                <p className="text-sm text-slate-600">
                  All features are 100% free forever. Your support helps cover hosting and development costs.
                </p>
              </div>
              <Link href="/pricing">
                <Button size="lg" className="bg-gradient-to-r from-orange-500 to-amber-500">
                  <Gift className="w-5 h-5 mr-2" />
                  Support Development
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Back to App */}
        <div className="text-center">
          <Link href="/app">
            <Button size="lg" variant="outline">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to MobileToolsBox
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

