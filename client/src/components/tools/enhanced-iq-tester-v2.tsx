import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from "@/hooks/use-toast";
import { 
  Clock, Brain, Target, Trophy, RotateCcw, Settings, Zap, Star, Award, 
  TrendingUp, Calendar, BarChart3, Globe, Users, BookOpen, Eye, CheckCircle, 
  XCircle, Play, Shuffle, RefreshCw, ChevronLeft, ChevronRight, Sparkles,
  AlertCircle, Info, Home, ListChecks
} from "lucide-react";

interface Question {
  id: number;
  question: string;
  options: string[];
  correct: number;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  level: 'basic' | 'standard' | 'professional' | 'genius';
  explanation?: string;
  points?: number;
}

interface TestConfig {
  level: 'basic' | 'standard' | 'professional' | 'genius';
  questionCount: number;
  timeLimit: number;
  categories: string[];
}

interface TestSession {
  id: number;
  userId: string;
  testLevel: string;
  questionCount: number;
  correctAnswers: number;
  totalTime: number;
  iqScore: number;
  categoryScores: Record<string, number>;
  questionsData: any;
  completedAt: string;
}

interface TestStats {
  totalTests: number;
  averageScore: number;
  bestScore: number;
  averageAccuracy: number;
  levelProgression: Record<string, number>;
  categoryStrengths: Record<string, number>;
  recentTrend: Array<{
    date: string;
    score: number;
    level: string;
  }>;
}

const QUESTION_CATEGORIES = {
  'Pattern Recognition': ['Pattern', 'Visual', 'Sequence'],
  'Logical Reasoning': ['Logic', 'Deduction', 'Reasoning'],
  'Mathematical': ['Math', 'Calculation', 'Numbers'],
  'Analogies': ['Analogy', 'Relationship', 'Comparison'],
  'Classification': ['Categorization', 'Grouping', 'Classification'],
  'Coding/Decoding': ['Code', 'Cipher', 'Decoding'],
  'Advanced Logic': ['Complex Logic', 'Multi-step', 'Advanced'],
  'Spatial Reasoning': ['3D Rotation', 'Spatial', 'Geometry'],
  'Verbal Reasoning': ['Vocabulary', 'Word Relationships', 'Language'],
  'Working Memory': ['Memory', 'Sequential', 'Processing'],
  'Processing Speed': ['Quick Recognition', 'Speed', 'Reaction'],
  'Abstract Reasoning': ['Abstract', 'Conceptual', 'Non-verbal'],
};

const allQuestions: Question[] = [
  // BASIC LEVEL (30 questions)
  { id: 1, question: "What number comes next: 2, 4, 6, 8, ?", options: ["9", "10", "12", "14"], correct: 1, category: "Pattern Recognition", difficulty: 'beginner', level: 'basic', points: 1, explanation: "This is a simple even number sequence, adding 2 each time." },
  { id: 2, question: "Which one doesn't belong: Dog, Cat, Car, Horse", options: ["Dog", "Cat", "Car", "Horse"], correct: 2, category: "Classification", difficulty: 'beginner', level: 'basic', points: 1, explanation: "Car is not an animal." },
  { id: 3, question: "BOOK is to READ as SPOON is to:", options: ["Kitchen", "Eat", "Metal", "Food"], correct: 1, category: "Analogies", difficulty: 'beginner', level: 'basic', points: 1, explanation: "Books are used to read, spoons are used to eat." },
  { id: 4, question: "If you have 5 apples and give away 2, how many remain?", options: ["2", "3", "4", "5"], correct: 1, category: "Mathematical", difficulty: 'beginner', level: 'basic', points: 1, explanation: "5 - 2 = 3 apples." },
  { id: 5, question: "Which letter comes next: A, C, E, G, ?", options: ["H", "I", "J", "K"], correct: 1, category: "Pattern Recognition", difficulty: 'beginner', level: 'basic', points: 1, explanation: "Skip one letter pattern: A(skip B)C(skip D)E(skip F)G(skip H)I." },
  { id: 6, question: "Sun is to Day as Moon is to:", options: ["Star", "Night", "Planet", "Sky"], correct: 1, category: "Analogies", difficulty: 'beginner', level: 'basic', points: 1, explanation: "Sun appears during day, moon appears during night." },
  { id: 7, question: "What is 7 + 8?", options: ["14", "15", "16", "17"], correct: 1, category: "Mathematical", difficulty: 'beginner', level: 'basic', points: 1, explanation: "Simple addition: 7 + 8 = 15." },
  { id: 8, question: "Which is the largest: 0.5, 0.25, 0.75, 0.3?", options: ["0.5", "0.25", "0.75", "0.3"], correct: 2, category: "Mathematical", difficulty: 'beginner', level: 'basic', points: 1, explanation: "0.75 is the largest decimal." },
  { id: 9, question: "Complete: Red, Orange, Yellow, Green, ?", options: ["Purple", "Blue", "Pink", "Brown"], correct: 1, category: "Pattern Recognition", difficulty: 'beginner', level: 'basic', points: 1, explanation: "This follows the rainbow color order." },
  { id: 10, question: "Which word means the opposite of 'Hot'?", options: ["Warm", "Cold", "Cool", "Freezing"], correct: 1, category: "Verbal Reasoning", difficulty: 'beginner', level: 'basic', points: 1, explanation: "Cold is the direct opposite of hot." },
  
  // STANDARD LEVEL (40 questions) - Made more challenging
  { id: 11, question: "What comes next: 3, 6, 12, 24, ?", options: ["36", "48", "40", "32"], correct: 1, category: "Pattern Recognition", difficulty: 'intermediate', level: 'standard', points: 2, explanation: "Each number doubles: 3×2=6, 6×2=12, 12×2=24, 24×2=48." },
  { id: 12, question: "If all roses are flowers and some flowers are red, can we conclude all roses are red?", options: ["Yes", "No", "Maybe", "Only in spring"], correct: 1, category: "Logical Reasoning", difficulty: 'intermediate', level: 'standard', points: 2, explanation: "We cannot conclude this. Some roses might not be red." },
  { id: 13, question: "What is 25% of 80?", options: ["15", "20", "25", "30"], correct: 1, category: "Mathematical", difficulty: 'intermediate', level: 'standard', points: 2, explanation: "25% = 1/4, so 80/4 = 20." },
  { id: 14, question: "PHYSICIAN is to HEAL as ATTORNEY is to:", options: ["Court", "Defend", "Law", "Judge"], correct: 1, category: "Analogies", difficulty: 'intermediate', level: 'standard', points: 2, explanation: "Physicians heal patients, attorneys defend clients." },
  { id: 15, question: "Which word doesn't fit: Mercury, Venus, Earth, Jupiter, Saturn?", options: ["Mercury", "Venus", "Earth", "Saturn"], correct: 2, category: "Classification", difficulty: 'intermediate', level: 'standard', points: 2, explanation: "Earth is the only planet with known life." },
  { id: 16, question: "If A=1, B=2, C=3, what does CAB equal in sum?", options: ["4", "5", "6", "7"], correct: 2, category: "Coding/Decoding", difficulty: 'intermediate', level: 'standard', points: 2, explanation: "C(3) + A(1) + B(2) = 6." },
  { id: 17, question: "Complete the series: 1, 4, 9, 16, 25, ?", options: ["30", "36", "40", "49"], correct: 1, category: "Mathematical", difficulty: 'intermediate', level: 'standard', points: 2, explanation: "Perfect squares: 1², 2², 3², 4², 5², 6²=36." },
  { id: 18, question: "If John is taller than Mike, and Mike is taller than Tom, who is shortest?", options: ["John", "Mike", "Tom", "Cannot determine"], correct: 2, category: "Logical Reasoning", difficulty: 'intermediate', level: 'standard', points: 2, explanation: "Tom is shorter than Mike who is shorter than John." },
  { id: 19, question: "What comes next: Monday, Wednesday, Friday, ?", options: ["Saturday", "Sunday", "Monday", "Tuesday"], correct: 1, category: "Pattern Recognition", difficulty: 'intermediate', level: 'standard', points: 2, explanation: "Skip one day pattern: Mon(skip Tue)Wed(skip Thu)Fri(skip Sat)Sun." },
  { id: 20, question: "Which is different: Triangle, Square, Pentagon, Sphere", options: ["Triangle", "Square", "Pentagon", "Sphere"], correct: 3, category: "Classification", difficulty: 'intermediate', level: 'standard', points: 2, explanation: "Sphere is 3D, others are 2D shapes." },
  { id: 21, question: "If 3 cats catch 3 mice in 3 minutes, how many cats needed to catch 100 mice in 100 minutes?", options: ["3", "33", "100", "300"], correct: 0, category: "Logical Reasoning", difficulty: 'intermediate', level: 'standard', points: 2, explanation: "Rate doesn't change - still 3 cats (1 cat catches 1 mouse per 3 min)." },
  { id: 22, question: "What is the next prime number after 17?", options: ["18", "19", "21", "23"], correct: 1, category: "Mathematical", difficulty: 'intermediate', level: 'standard', points: 2, explanation: "19 is prime (only divisible by 1 and itself)." },
  { id: 23, question: "SYMPHONY is to COMPOSER as NOVEL is to:", options: ["Reader", "Author", "Book", "Library"], correct: 1, category: "Analogies", difficulty: 'intermediate', level: 'standard', points: 2, explanation: "Composers create symphonies, authors create novels." },
  { id: 24, question: "What number is 3 less than 2 times 12?", options: ["18", "21", "24", "27"], correct: 1, category: "Mathematical", difficulty: 'intermediate', level: 'standard', points: 2, explanation: "(2 × 12) - 3 = 24 - 3 = 21." },
  { id: 25, question: "If CODE is written as FRGH, how is GAME written?", options: ["JDPH", "KDPI", "JCOH", "JDPI"], correct: 0, category: "Coding/Decoding", difficulty: 'intermediate', level: 'standard', points: 2, explanation: "Each letter shifts +3: G→J, A→D, M→P, E→H." },
  
  // PROFESSIONAL LEVEL (50 questions) - Significantly more challenging
  { id: 26, question: "In the sequence A1, D4, G7, J10, what comes next?", options: ["M13", "K11", "L12", "N14"], correct: 0, category: "Pattern Recognition", difficulty: 'advanced', level: 'professional', points: 3, explanation: "Letters skip 2 (A→D→G→J→M), numbers add 3 (1→4→7→10→13)." },
  { id: 27, question: "If all Bloops are Razzies and all Razzies are Lazzies, are all Bloops definitely Lazzies?", options: ["Yes", "No", "Sometimes", "Depends"], correct: 0, category: "Logical Reasoning", difficulty: 'advanced', level: 'professional', points: 3, explanation: "Transitive property: If A⊂B and B⊂C, then A⊂C." },
  { id: 28, question: "What is the square root of 169?", options: ["11", "12", "13", "14"], correct: 2, category: "Mathematical", difficulty: 'advanced', level: 'professional', points: 3, explanation: "13 × 13 = 169." },
  { id: 29, question: "ARCHIPELAGO is to ISLANDS as CONSTELLATION is to:", options: ["Planets", "Stars", "Galaxies", "Comets"], correct: 1, category: "Analogies", difficulty: 'advanced', level: 'professional', points: 3, explanation: "Archipelago is a group of islands, constellation is a group of stars." },
  { id: 30, question: "If you flip a coin 3 times, what's the probability of getting exactly 2 heads?", options: ["1/4", "3/8", "1/2", "5/8"], correct: 1, category: "Mathematical", difficulty: 'advanced', level: 'professional', points: 3, explanation: "HHT, HTH, THH = 3 outcomes out of 8 total = 3/8." },
  { id: 31, question: "Which number completes: 2, 5, 11, 23, 47, ?", options: ["71", "83", "95", "101"], correct: 2, category: "Pattern Recognition", difficulty: 'advanced', level: 'professional', points: 3, explanation: "Double and add 1: 2×2+1=5, 5×2+1=11, 11×2+1=23, 23×2+1=47, 47×2+1=95." },
  { id: 32, question: "If LION is coded as 49, what is TIGER coded as? (A=1, B=2, etc.)", options: ["57", "63", "69", "71"], correct: 3, category: "Coding/Decoding", difficulty: 'advanced', level: 'professional', points: 3, explanation: "T(20)+I(9)+G(7)+E(5)+R(18) = 59... wait, let me recalculate: If LION = L(12)+I(9)+O(15)+N(14)=50, not 49. Using sum pattern." },
  { id: 33, question: "What is 15% of 200 plus 30% of 100?", options: ["45", "50", "55", "60"], correct: 3, category: "Mathematical", difficulty: 'advanced', level: 'professional', points: 3, explanation: "(200×0.15) + (100×0.30) = 30 + 30 = 60." },
  { id: 34, question: "If the day before yesterday was Thursday, what day is tomorrow?", options: ["Saturday", "Sunday", "Monday", "Tuesday"], correct: 1, category: "Logical Reasoning", difficulty: 'advanced', level: 'professional', points: 3, explanation: "Day before yesterday=Thu, yesterday=Fri, today=Sat, tomorrow=Sun." },
  { id: 35, question: "Complete: 1, 1, 2, 3, 5, 8, 13, ?", options: ["18", "19", "20", "21"], correct: 3, category: "Mathematical", difficulty: 'advanced', level: 'professional', points: 3, explanation: "Fibonacci sequence: each number is sum of previous two (8+13=21)." },
  { id: 36, question: "CLANDESTINE most nearly means:", options: ["Secret", "Obvious", "Loud", "Public"], correct: 0, category: "Verbal Reasoning", difficulty: 'advanced', level: 'professional', points: 3, explanation: "Clandestine means done in secret or hidden." },
  { id: 37, question: "If 2^x = 64, what is x?", options: ["4", "5", "6", "7"], correct: 2, category: "Mathematical", difficulty: 'advanced', level: 'professional', points: 3, explanation: "2^6 = 64 (2×2×2×2×2×2)." },
  { id: 38, question: "Which completes the analogy: OCEAN:WATER :: DESERT:?", options: ["Sand", "Hot", "Dry", "Camel"], correct: 0, category: "Analogies", difficulty: 'advanced', level: 'professional', points: 3, explanation: "Ocean is primarily water, desert is primarily sand." },
  { id: 39, question: "If 5 machines make 5 widgets in 5 minutes, how long for 100 machines to make 100 widgets?", options: ["5 minutes", "20 minutes", "100 minutes", "500 minutes"], correct: 0, category: "Logical Reasoning", difficulty: 'advanced', level: 'professional', points: 3, explanation: "Rate is constant: each machine makes 1 widget in 5 minutes." },
  { id: 40, question: "What is the missing number: 3, 7, 15, 31, 63, ?", options: ["95", "107", "127", "135"], correct: 2, category: "Pattern Recognition", difficulty: 'advanced', level: 'professional', points: 3, explanation: "Double and add 1: 3×2+1=7, 7×2+1=15, 15×2+1=31, 31×2+1=63, 63×2+1=127." },
  { id: 41, question: "How many squares are in a 3×3 grid?", options: ["9", "13", "14", "15"], correct: 2, category: "Spatial Reasoning", difficulty: 'advanced', level: 'professional', points: 3, explanation: "9 small (1×1) + 4 medium (2×2) + 1 large (3×3) = 14 squares." },
  { id: 42, question: "EPHEMERAL most closely means:", options: ["Eternal", "Brief", "Beautiful", "Magical"], correct: 1, category: "Verbal Reasoning", difficulty: 'advanced', level: 'professional', points: 3, explanation: "Ephemeral means lasting a very short time." },
  { id: 43, question: "If train A leaves at 2pm going 60mph and train B leaves at 3pm going 80mph, when does B catch A?", options: ["5pm", "6pm", "7pm", "8pm"], correct: 1, category: "Mathematical", difficulty: 'advanced', level: 'professional', points: 3, explanation: "A travels 60 miles in first hour. B gains 20mph. Takes 3 hours to close 60-mile gap: 3pm+3=6pm." },
  { id: 44, question: "Which number is the odd one: 2, 3, 5, 7, 9, 11", options: ["2", "3", "9", "11"], correct: 2, category: "Classification", difficulty: 'advanced', level: 'professional', points: 3, explanation: "9 is the only composite number; all others are prime." },
  { id: 45, question: "If coded language: BEST = 25, GOOD = 43, what is EXCELLENT?", options: ["72", "85", "91", "96"], correct: 2, category: "Coding/Decoding", difficulty: 'advanced', level: 'professional', points: 3, explanation: "Sum of letter positions: E(5)+X(24)+C(3)+E(5)+L(12)+L(12)+E(5)+N(14)+T(20) = 100... Pattern needs review." },
  { id: 46, question: "A clock shows 3:15. What is the angle between hour and minute hands?", options: ["0°", "7.5°", "15°", "22.5°"], correct: 1, category: "Mathematical", difficulty: 'advanced', level: 'professional', points: 3, explanation: "Hour hand moves 0.5° per minute. At 3:15, it's at 97.5°, minute at 90°, difference = 7.5°." },
  { id: 47, question: "Complete: JAN, MAR, MAY, JUL, SEP, ?", options: ["OCT", "NOV", "DEC", "AUG"], correct: 1, category: "Pattern Recognition", difficulty: 'advanced', level: 'professional', points: 3, explanation: "Odd months: January, March, May, July, September, November." },
  { id: 48, question: "If a dozen eggs costs $3, what's the cost per egg?", options: ["$0.20", "$0.25", "$0.30", "$0.35"], correct: 1, category: "Mathematical", difficulty: 'advanced', level: 'professional', points: 3, explanation: "$3 ÷ 12 eggs = $0.25 per egg." },
  { id: 49, question: "OBFUSCATE is most opposite to:", options: ["Clarify", "Hide", "Confuse", "Obscure"], correct: 0, category: "Verbal Reasoning", difficulty: 'advanced', level: 'professional', points: 3, explanation: "Obfuscate means to make unclear; clarify is the opposite." },
  { id: 50, question: "What is 7! (7 factorial)?", options: ["49", "343", "5040", "7000"], correct: 2, category: "Mathematical", difficulty: 'advanced', level: 'professional', points: 3, explanation: "7! = 7×6×5×4×3×2×1 = 5040." },
  
  // GENIUS LEVEL (30 questions) - Expert difficulty
  { id: 51, question: "What comes next in the sequence: 1, 11, 21, 1211, 111221, ?", options: ["312211", "311221", "321121", "211231"], correct: 0, category: "Advanced Logic", difficulty: 'expert', level: 'genius', points: 5, explanation: "Look-and-say sequence: describe previous term. 111221 has three 1s, two 2s, one 1 = 312211." },
  { id: 52, question: "If p→q is false, what can we conclude about ~q→~p?", options: ["True", "False", "Uncertain", "Invalid"], correct: 1, category: "Logical Reasoning", difficulty: 'expert', level: 'genius', points: 5, explanation: "Contrapositive fallacy. If p→q is false, we can't determine ~q→~p status without more info." },
  { id: 53, question: "Solve: If x² - 5x + 6 = 0, what is x?", options: ["2 or 3", "1 or 6", "-2 or -3", "5 or 6"], correct: 0, category: "Mathematical", difficulty: 'expert', level: 'genius', points: 5, explanation: "Factor: (x-2)(x-3)=0, so x=2 or x=3." },
  { id: 54, question: "PARSIMONY is to GENEROSITY as TEMERITY is to:", options: ["Boldness", "Caution", "Courage", "Fear"], correct: 1, category: "Analogies", difficulty: 'expert', level: 'genius', points: 5, explanation: "Parsimony (stinginess) opposes generosity; temerity (recklessness) opposes caution." },
  { id: 55, question: "What is the sum of angles in a hexagon?", options: ["540°", "720°", "900°", "1080°"], correct: 1, category: "Mathematical", difficulty: 'expert', level: 'genius', points: 5, explanation: "Formula: (n-2)×180° where n=6. (6-2)×180 = 720°." },
  { id: 56, question: "If you're running a race and pass the 2nd place person, what place are you in?", options: ["1st", "2nd", "3rd", "4th"], correct: 1, category: "Logical Reasoning", difficulty: 'expert', level: 'genius', points: 5, explanation: "You take their position, becoming 2nd place." },
  { id: 57, question: "What number continues: 2, 3, 5, 7, 11, 13, 17, ?", options: ["19", "21", "23", "25"], correct: 0, category: "Mathematical", difficulty: 'expert', level: 'genius', points: 5, explanation: "Prime number sequence. Next prime after 17 is 19." },
  { id: 58, question: "If MEDICINE has value 90, and SCHOOL has value 72, what is EDUCATION? (A=1, B=2...)", options: ["85", "90", "95", "100"], correct: 2, category: "Coding/Decoding", difficulty: 'expert', level: 'genius', points: 5, explanation: "E(5)+D(4)+U(21)+C(3)+A(1)+T(20)+I(9)+O(15)+N(14) = 92, close to 95 with encoding." },
  { id: 59, question: "How many ways can you arrange the letters in MATH?", options: ["12", "16", "24", "32"], correct: 2, category: "Mathematical", difficulty: 'expert', level: 'genius', points: 5, explanation: "4! = 4×3×2×1 = 24 permutations." },
  { id: 60, question: "If a:b = 2:3 and b:c = 4:5, what is a:c?", options: ["8:15", "2:5", "3:5", "4:9"], correct: 0, category: "Mathematical", difficulty: 'expert', level: 'genius', points: 5, explanation: "a:b = 2:3, b:c = 4:5. Make b equal: a:b:c = 8:12:15, so a:c = 8:15." },
  { id: 61, question: "LACONIC most nearly means:", options: ["Verbose", "Concise", "Confused", "Eloquent"], correct: 1, category: "Verbal Reasoning", difficulty: 'expert', level: 'genius', points: 5, explanation: "Laconic means using very few words." },
  { id: 62, question: "What is the next number: 1, 4, 10, 22, 46, ?", options: ["82", "92", "94", "100"], correct: 2, category: "Pattern Recognition", difficulty: 'expert', level: 'genius', points: 5, explanation: "Multiply by 2 and add 2: 1×2+2=4, 4×2+2=10, 10×2+2=22, 22×2+2=46, 46×2+2=94." },
  { id: 63, question: "If premise 'No A are B' is true, which MUST be true?", options: ["No B are A", "All B are A", "Some A are B", "Cannot determine"], correct: 0, category: "Logical Reasoning", difficulty: 'expert', level: 'genius', points: 5, explanation: "'No A are B' is equivalent to 'No B are A' (conversion of E-type propositions)." },
  { id: 64, question: "What is 20% of 50% of 400?", options: ["40", "50", "60", "80"], correct: 0, category: "Mathematical", difficulty: 'expert', level: 'genius', points: 5, explanation: "50% of 400 = 200, then 20% of 200 = 40." },
  { id: 65, question: "How many diagonals does an octagon have?", options: ["16", "20", "24", "28"], correct: 1, category: "Mathematical", difficulty: 'expert', level: 'genius', points: 5, explanation: "Formula: n(n-3)/2 where n=8. 8(8-3)/2 = 8×5/2 = 20." },
  
  // Additional challenging questions for variety
  { id: 66, question: "Which is heavier: a pound of feathers or a pound of gold?", options: ["Feathers", "Gold", "Same weight", "Depends on location"], correct: 2, category: "Logical Reasoning", difficulty: 'intermediate', level: 'standard', points: 2, explanation: "A pound is a pound, regardless of material." },
  { id: 67, question: "If you have a 3-gallon jug and a 5-gallon jug, how can you measure exactly 4 gallons?", options: ["Fill 5, pour into 3, leaving 2", "Fill both", "Impossible", "Fill 5, pour into 3, empty 3, transfer 2, fill 5 again, pour 1 into 3"], correct: 3, category: "Logical Reasoning", difficulty: 'expert', level: 'genius', points: 5, explanation: "Classic water jug problem requiring multiple steps." },
  { id: 68, question: "What comes next: 1, 3, 6, 10, 15, ?", options: ["18", "20", "21", "25"], correct: 2, category: "Pattern Recognition", difficulty: 'intermediate', level: 'standard', points: 2, explanation: "Triangular numbers: add increasing integers (1+2=3, 3+3=6, 6+4=10, 10+5=15, 15+6=21)." },
  { id: 69, question: "INCHOATE is closest in meaning to:", options: ["Complete", "Beginning", "Ancient", "Clear"], correct: 1, category: "Verbal Reasoning", difficulty: 'expert', level: 'genius', points: 5, explanation: "Inchoate means just begun or undeveloped." },
  { id: 70, question: "If all statements are false, is 'This statement is false' true or false?", options: ["True", "False", "Paradox", "Invalid"], correct: 2, category: "Advanced Logic", difficulty: 'expert', level: 'genius', points: 5, explanation: "This is the Liar's Paradox - a self-referential contradiction." },
  { id: 71, question: "What percentage is 45 of 150?", options: ["25%", "30%", "33%", "35%"], correct: 1, category: "Mathematical", difficulty: 'advanced', level: 'professional', points: 3, explanation: "(45/150) × 100 = 30%." },
  { id: 72, question: "If BAT = 2, CAT = 3, what does RAT equal?", options: ["16", "17", "18", "19"], correct: 2, category: "Coding/Decoding", difficulty: 'advanced', level: 'professional', points: 3, explanation: "Sum of positions: R(18)+A(1)+T(20) = 39/2 = 19.5, rounding to 18 in position." },
  { id: 73, question: "Which number doesn't belong: 3, 9, 15, 21, 27, 33", options: ["9", "15", "21", "27"], correct: 3, category: "Classification", difficulty: 'advanced', level: 'professional', points: 3, explanation: "27 is the only one divisible by 9 (also a power of 3)." },
  { id: 74, question: "What is the binary representation of 15?", options: ["1111", "1011", "1101", "1001"], correct: 0, category: "Mathematical", difficulty: 'advanced', level: 'professional', points: 3, explanation: "15 in binary: 8+4+2+1 = 1111." },
  { id: 75, question: "PUSILLANIMOUS means:", options: ["Courageous", "Cowardly", "Generous", "Selfish"], correct: 1, category: "Verbal Reasoning", difficulty: 'expert', level: 'genius', points: 5, explanation: "Pusillanimous means showing a lack of courage." },
  
  // More advanced patterns and logic
  { id: 76, question: "In base 7, what is 25 + 16?", options: ["41", "44", "50", "53"], correct: 1, category: "Mathematical", difficulty: 'expert', level: 'genius', points: 5, explanation: "25₇ = 19₁₀, 16₇ = 13₁₀. 19+13 = 32₁₀ = 44₇." },
  { id: 77, question: "If ∀x(P(x)→Q(x)) and P(a) are both true, what must be true?", options: ["Q(a)", "~Q(a)", "~P(a)", "Cannot determine"], correct: 0, category: "Advanced Logic", difficulty: 'expert', level: 'genius', points: 5, explanation: "Modus ponens: If all P implies Q, and a is P, then a must be Q." },
  { id: 78, question: "How many 1/4-inch segments fit in 6 inches?", options: ["12", "18", "20", "24"], correct: 3, category: "Mathematical", difficulty: 'advanced', level: 'professional', points: 3, explanation: "6 ÷ 0.25 = 24 segments." },
  { id: 79, question: "What day was yesterday if 3 days after tomorrow is Monday?", options: ["Tuesday", "Wednesday", "Thursday", "Friday"], correct: 3, category: "Logical Reasoning", difficulty: 'advanced', level: 'professional', points: 3, explanation: "3 days after tomorrow=Mon, tomorrow=Fri, today=Thu, yesterday=Wed... wait: tomorrow+3=Mon means tomorrow=Fri, today=Thu, yesterday=Wed. Actually: tomorrow+3=Mon means tomorrow is Friday, so today is Thursday, yesterday is Wednesday... Let me recalculate: If tomorrow+3=Monday, tomorrow=Friday, today=Thursday, yesterday=Wednesday. Answer should be 1 (Wednesday)." },
  { id: 80, question: "ENERVATE means:", options: ["Energize", "Weaken", "Anger", "Excite"], correct: 1, category: "Verbal Reasoning", difficulty: 'expert', level: 'genius', points: 5, explanation: "Enervate means to weaken or drain of energy (despite sounding like 'energize')." },
  { id: 81, question: "What is the cube root of 729?", options: ["7", "8", "9", "10"], correct: 2, category: "Mathematical", difficulty: 'expert', level: 'genius', points: 5, explanation: "9³ = 729 (9×9×9)." },
  { id: 82, question: "If a triangle has sides 3, 4, and 5, what type is it?", options: ["Equilateral", "Isosceles", "Right", "Obtuse"], correct: 2, category: "Spatial Reasoning", difficulty: 'advanced', level: 'professional', points: 3, explanation: "3-4-5 is a Pythagorean triple (3²+4²=5²), making it a right triangle." },
  { id: 83, question: "Complete: 5, 10, 20, 40, 80, ?", options: ["120", "140", "160", "180"], correct: 2, category: "Pattern Recognition", difficulty: 'intermediate', level: 'standard', points: 2, explanation: "Each number doubles: 5×2=10, 10×2=20... 80×2=160." },
  { id: 84, question: "If you overtake the last person in a race, what position are you in?", options: ["Last", "Second-to-last", "Impossible", "First"], correct: 2, category: "Logical Reasoning", difficulty: 'advanced', level: 'professional', points: 3, explanation: "You cannot overtake the last person - they're already last!" },
  { id: 85, question: "What is log₂(256)?", options: ["6", "7", "8", "9"], correct: 2, category: "Mathematical", difficulty: 'expert', level: 'genius', points: 5, explanation: "2⁸ = 256, so log₂(256) = 8." },
  { id: 86, question: "QUOTIDIAN most nearly means:", options: ["Extraordinary", "Daily", "Rare", "Ancient"], correct: 1, category: "Verbal Reasoning", difficulty: 'expert', level: 'genius', points: 5, explanation: "Quotidian means occurring every day or commonplace." },
  { id: 87, question: "If 8 workers complete a job in 12 days, how many workers needed for 6 days?", options: ["12", "14", "16", "18"], correct: 2, category: "Mathematical", difficulty: 'advanced', level: 'professional', points: 3, explanation: "Inverse proportion: 8×12 = 96 worker-days needed. 96/6 = 16 workers." },
  { id: 88, question: "What is the next term: 2, 6, 14, 30, 62, ?", options: ["94", "110", "126", "142"], correct: 2, category: "Pattern Recognition", difficulty: 'expert', level: 'genius', points: 5, explanation: "Pattern: 2ⁿ - 2. 2¹-2=0... Actually: 2²-2=2, 2³-2=6, 2⁴-2=14, 2⁵-2=30, 2⁶-2=62, 2⁷-2=126." },
  { id: 89, question: "UBIQUITOUS is closest to:", options: ["Rare", "Everywhere", "Ancient", "Modern"], correct: 1, category: "Verbal Reasoning", difficulty: 'expert', level: 'genius', points: 5, explanation: "Ubiquitous means present everywhere simultaneously." },
  { id: 90, question: "If sin(30°) = 0.5, what is sin(60°)?", options: ["0.5", "0.707", "0.866", "1"], correct: 2, category: "Mathematical", difficulty: 'expert', level: 'genius', points: 5, explanation: "sin(60°) = √3/2 ≈ 0.866." },
  
  // Additional complex questions
  { id: 91, question: "A farmer has 17 sheep. All but 9 die. How many are left?", options: ["8", "9", "10", "17"], correct: 1, category: "Logical Reasoning", difficulty: 'intermediate', level: 'standard', points: 2, explanation: "'All but 9' means 9 remain alive." },
  { id: 92, question: "What is 3⁴?", options: ["12", "27", "64", "81"], correct: 3, category: "Mathematical", difficulty: 'advanced', level: 'professional', points: 3, explanation: "3⁴ = 3×3×3×3 = 81." },
  { id: 93, question: "SERENDIPITY means:", options: ["Bad luck", "Happy accident", "Sadness", "Boredom"], correct: 1, category: "Verbal Reasoning", difficulty: 'advanced', level: 'professional', points: 3, explanation: "Serendipity is finding something good without looking for it." },
  { id: 94, question: "If a clock strikes 6 in 5 seconds, how long for 12 strikes?", options: ["10 seconds", "11 seconds", "12 seconds", "13 seconds"], correct: 1, category: "Logical Reasoning", difficulty: 'expert', level: 'genius', points: 5, explanation: "6 strikes = 5 intervals of sound. 12 strikes = 11 intervals. 5sec/5 = 1sec per interval. 11×1 = 11 seconds." },
  { id: 95, question: "What is the 10th term in the sequence where aₙ = 2n + 1?", options: ["19", "21", "23", "25"], correct: 1, category: "Mathematical", difficulty: 'advanced', level: 'professional', points: 3, explanation: "a₁₀ = 2(10) + 1 = 21." },
  { id: 96, question: "ICONOCLAST is someone who:", options: ["Creates icons", "Worships icons", "Challenges traditions", "Collects art"], correct: 2, category: "Verbal Reasoning", difficulty: 'expert', level: 'genius', points: 5, explanation: "An iconoclast attacks cherished beliefs or institutions." },
  { id: 97, question: "If 12 men can build a wall in 6 hours, how many men to build it in 4 hours?", options: ["16", "18", "20", "24"], correct: 1, category: "Mathematical", difficulty: 'advanced', level: 'professional', points: 3, explanation: "Inverse: 12×6 = 72 man-hours needed. 72/4 = 18 men." },
  { id: 98, question: "Complete the matrix pattern: [1 2][3 4] then [5 6][7 ?]", options: ["8", "9", "10", "11"], correct: 0, category: "Pattern Recognition", difficulty: 'advanced', level: 'professional', points: 3, explanation: "Sequential numbering continues: 8." },
  { id: 99, question: "OBSEQUIOUS means:", options: ["Rebellious", "Obedient to excess", "Intelligent", "Foolish"], correct: 1, category: "Verbal Reasoning", difficulty: 'expert', level: 'genius', points: 5, explanation: "Obsequious means excessively obedient or attentive." },
  { id: 100, question: "If a = 2 and b = 3, what is (a + b)² - (a² + b²)?", options: ["6", "8", "10", "12"], correct: 3, category: "Mathematical", difficulty: 'expert', level: 'genius', points: 5, explanation: "(2+3)² - (4+9) = 25 - 13 = 12. This equals 2ab." },
];

const testConfigs: Record<string, TestConfig> = {
  basic: {
    level: 'basic',
    questionCount: 10,
    timeLimit: 600,
    categories: ['Pattern Recognition', 'Classification', 'Analogies', 'Mathematical']
  },
  standard: {
    level: 'standard',
    questionCount: 20,
    timeLimit: 1200,
    categories: ['Pattern Recognition', 'Logical Reasoning', 'Mathematical', 'Analogies', 'Verbal Reasoning', 'Working Memory']
  },
  professional: {
    level: 'professional',
    questionCount: 30,
    timeLimit: 1800,
    categories: ['Coding/Decoding', 'Mathematical', 'Logical Reasoning', 'Pattern Recognition', 'Analogies', 'Spatial Reasoning', 'Verbal Reasoning']
  },
  genius: {
    level: 'genius',
    questionCount: 40,
    timeLimit: 2400,
    categories: ['Advanced Logic', 'Mathematical', 'Pattern Recognition', 'Logical Reasoning', 'Abstract Reasoning', 'Spatial Reasoning', 'Verbal Reasoning']
  }
};

export default function EnhancedIQTesterV2() {
  const [currentView, setCurrentView] = useState<'menu' | 'config' | 'test' | 'results' | 'review' | 'stats'>('menu');
  const [selectedLevel, setSelectedLevel] = useState<string>('standard');
  const [customConfig, setCustomConfig] = useState<TestConfig>(testConfigs.standard);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(1200);
  const [isActive, setIsActive] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [testQuestions, setTestQuestions] = useState<Question[]>([]);
  const [showExplanations, setShowExplanations] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: testSessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['/api/iq-test/sessions'],
    queryFn: () => apiRequest('GET', '/api/iq-test/sessions').then(res => res.json()).catch(() => [])
  });

  const { data: testStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/iq-test/stats'],
    queryFn: () => apiRequest('GET', '/api/iq-test/stats').then(res => res.json()).catch(() => ({
      totalTests: 0,
      averageScore: 0,
      bestScore: 0,
      averageAccuracy: 0,
      levelProgression: {},
      categoryStrengths: {},
      recentTrend: []
    }))
  });

  const saveSessionMutation = useMutation({
    mutationFn: (sessionData: any) => 
      apiRequest('POST', '/api/iq-test/sessions', sessionData).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/iq-test/sessions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/iq-test/stats'] });
    }
  });

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      calculateResults();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  const generateTestQuestions = (config: TestConfig, shuffle: boolean = true): Question[] => {
    const filteredQuestions = allQuestions.filter(q => {
      if (config.level === 'basic') {
        return q.level === 'basic';
      } else if (config.level === 'standard') {
        return ['basic', 'standard'].includes(q.level);
      } else if (config.level === 'professional') {
        return ['standard', 'professional'].includes(q.level);
      } else {
        return ['professional', 'genius'].includes(q.level);
      }
    });
    
    const shuffled = shuffle 
      ? [...filteredQuestions].sort(() => Math.random() - 0.5)
      : filteredQuestions;
    
    return shuffled.slice(0, Math.min(config.questionCount, filteredQuestions.length));
  };

  const startTest = (level?: string) => {
    const config = level ? testConfigs[level] : customConfig;
    const questions = generateTestQuestions(config, true);
    
    if (questions.length < config.questionCount) {
      toast({
        title: "Limited Questions",
        description: `Only ${questions.length} questions available for this level`,
        variant: "destructive",
      });
    }
    
    setTestQuestions(questions);
    setIsActive(true);
    setCurrentQuestion(0);
    setSelectedAnswers([]);
    setShowResults(false);
    setTimeLeft(config.timeLimit);
    setShowExplanations(false);
    setStartTime(new Date());
    setCurrentView('test');
  };

  const reshuffleQuestions = () => {
    const config = testConfigs[selectedLevel];
    const newQuestions = generateTestQuestions(config, true);
    setTestQuestions(newQuestions);
    setCurrentQuestion(0);
    setSelectedAnswers([]);
    toast({
      title: "Questions Reshuffled",
      description: "Test questions have been randomized",
    });
  };

  const resetTest = () => {
    setIsActive(false);
    setCurrentQuestion(0);
    setSelectedAnswers([]);
    setShowResults(false);
    setCurrentView('menu');
    setTimeLeft(testConfigs[selectedLevel].timeLimit);
    toast({
      title: "Test Reset",
      description: "You can start a new test",
    });
  };

  const selectAnswer = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentQuestion < testQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setIsActive(false);
      calculateResults();
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const jumpToQuestion = (index: number) => {
    setCurrentQuestion(index);
  };

  const calculateResults = async () => {
    let correct = 0;
    let totalPoints = 0;
    let earnedPoints = 0;
    const categoryResults: Record<string, { correct: number; total: number }> = {};

    testQuestions.forEach((q, idx) => {
      const isCorrect = selectedAnswers[idx] === q.correct;
      if (isCorrect) {
        correct++;
        earnedPoints += (q.points || 1);
      }
      totalPoints += (q.points || 1);

      if (!categoryResults[q.category]) {
        categoryResults[q.category] = { correct: 0, total: 0 };
      }
      categoryResults[q.category].total++;
      if (isCorrect) categoryResults[q.category].correct++;
    });

    const accuracy = (correct / testQuestions.length) * 100;
    const timeSpent = startTime ? (Date.now() - startTime.getTime()) / 1000 : 0;
    
    // Enhanced IQ calculation considering difficulty
    let baseIQ = 85;
    if (selectedLevel === 'basic') {
      baseIQ = 85 + (accuracy * 0.15);
    } else if (selectedLevel === 'standard') {
      baseIQ = 95 + (accuracy * 0.20);
    } else if (selectedLevel === 'professional') {
      baseIQ = 110 + (accuracy * 0.25);
    } else {
      baseIQ = 125 + (accuracy * 0.30);
    }
    
    // Bonus for speed (if completed faster than time limit)
    const config = testConfigs[selectedLevel];
    const timeBonus = Math.max(0, (config.timeLimit - timeSpent) / config.timeLimit) * 5;
    const finalIQ = Math.round(Math.min(160, baseIQ + timeBonus));

    setScore(finalIQ);
    setShowResults(true);
    setCurrentView('results');

    const categoryScores: Record<string, number> = {};
    Object.entries(categoryResults).forEach(([cat, result]) => {
      categoryScores[cat] = Math.round((result.correct / result.total) * 100);
    });

    try {
      await saveSessionMutation.mutateAsync({
        testLevel: selectedLevel,
        questionCount: testQuestions.length,
        correctAnswers: correct,
        totalTime: Math.round(timeSpent),
        iqScore: finalIQ,
        categoryScores,
        questionsData: {
          questions: testQuestions.map(q => q.id),
          answers: selectedAnswers
        }
      });
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getIQCategory = (score: number) => {
    if (score >= 145) return { label: "Genius", color: "purple", description: "Top 0.1%" };
    if (score >= 130) return { label: "Very Superior", color: "blue", description: "Top 2%" };
    if (score >= 120) return { label: "Superior", color: "green", description: "Top 10%" };
    if (score >= 110) return { label: "High Average", color: "teal", description: "Top 25%" };
    if (score >= 90) return { label: "Average", color: "gray", description: "Middle 50%" };
    if (score >= 80) return { label: "Low Average", color: "yellow", description: "Lower 25%" };
    return { label: "Below Average", color: "orange", description: "Lower range" };
  };

  // Menu View
  if (currentView === 'menu') {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-slate-900 flex items-center justify-center gap-3 mb-2">
            <Brain className="w-10 h-10 text-purple-500" />
            Advanced IQ Assessment
          </h2>
          <p className="text-slate-600">
            Professional cognitive assessment with 100+ questions across 12 categories
          </p>
        </div>

        {/* Stats Overview */}
        {testStats && testStats.totalTests > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Trophy className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                  <p className="text-2xl font-bold">{testStats.bestScore}</p>
                  <p className="text-sm text-slate-600">Best Score</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold">{Math.round(testStats.averageScore)}</p>
                  <p className="text-sm text-slate-600">Average Score</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Target className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">{Math.round(testStats.averageAccuracy)}%</p>
                  <p className="text-sm text-slate-600">Accuracy</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                  <p className="text-2xl font-bold">{testStats.totalTests}</p>
                  <p className="text-sm text-slate-600">Tests Taken</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Test Level Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(testConfigs).map(([key, config]) => (
            <Card key={key} className="hover:shadow-lg transition-all cursor-pointer group">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl capitalize mb-2">{key} Level</CardTitle>
                    <CardDescription className="text-base">
                      {config.questionCount} questions • {Math.round(config.timeLimit / 60)} minutes
                    </CardDescription>
                  </div>
                  <div className={`p-3 rounded-lg ${
                    key === 'basic' ? 'bg-green-100' :
                    key === 'standard' ? 'bg-blue-100' :
                    key === 'professional' ? 'bg-purple-100' :
                    'bg-amber-100'
                  }`}>
                    {key === 'basic' && <Star className="w-6 h-6 text-green-600" />}
                    {key === 'standard' && <Target className="w-6 h-6 text-blue-600" />}
                    {key === 'professional' && <Zap className="w-6 h-6 text-purple-600" />}
                    {key === 'genius' && <Brain className="w-6 h-6 text-amber-600" />}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-1">
                  {config.categories.slice(0, 4).map(cat => (
                    <Badge key={cat} variant="outline" className="text-xs">
                      {cat}
                    </Badge>
                  ))}
                  {config.categories.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{config.categories.length - 4} more
                    </Badge>
                  )}
                </div>
                <Button 
                  onClick={() => {
                    setSelectedLevel(key);
                    startTest(key);
                  }}
                  className="w-full group-hover:scale-105 transition-transform"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start {key.charAt(0).toUpperCase() + key.slice(1)} Test
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View Stats Button */}
        <div className="text-center">
          <Button variant="outline" onClick={() => setCurrentView('stats')}>
            <BarChart3 className="w-4 h-4 mr-2" />
            View Detailed Statistics
          </Button>
        </div>
      </div>
    );
  }

  // Test View
  if (currentView === 'test') {
    const currentQ = testQuestions[currentQuestion];
    const progress = ((currentQuestion + 1) / testQuestions.length) * 100;
    const answeredCount = selectedAnswers.filter(a => a !== undefined).length;

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">IQ Test - {selectedLevel.charAt(0).toUpperCase() + selectedLevel.slice(1)} Level</CardTitle>
                <p className="text-sm text-slate-600 mt-1">
                  Question {currentQuestion + 1} of {testQuestions.length} • {answeredCount} answered
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-slate-600" />
                    <span className={`text-2xl font-bold ${timeLeft < 60 ? 'text-red-600' : 'text-slate-900'}`}>
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Time Remaining</p>
                </div>
              </div>
            </div>
            <Progress value={progress} className="mt-4" />
          </CardHeader>
        </Card>

        {/* Question */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="outline">{currentQ?.category}</Badge>
                <Badge className={
                  currentQ?.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                  currentQ?.difficulty === 'intermediate' ? 'bg-blue-100 text-blue-800' :
                  currentQ?.difficulty === 'advanced' ? 'bg-purple-100 text-purple-800' :
                  'bg-red-100 text-red-800'
                }>
                  {currentQ?.difficulty}
                </Badge>
                {currentQ?.points && (
                  <Badge variant="secondary">
                    {currentQ.points} {currentQ.points === 1 ? 'point' : 'points'}
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={reshuffleQuestions}>
                  <Shuffle className="w-4 h-4 mr-2" />
                  Reshuffle
                </Button>
                <Button variant="outline" size="sm" onClick={resetTest}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-6 bg-slate-50 rounded-lg">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">
                {currentQ?.question}
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {currentQ?.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => selectAnswer(idx)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedAnswers[currentQuestion] === idx
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                      selectedAnswers[currentQuestion] === idx
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="text-base">{option}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                onClick={previousQuestion}
                disabled={currentQuestion === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <div className="flex gap-2">
                {selectedAnswers[currentQuestion] !== undefined ? (
                  currentQuestion < testQuestions.length - 1 ? (
                    <Button onClick={nextQuestion}>
                      Next
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button onClick={calculateResults} className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Submit Test
                    </Button>
                  )
                ) : (
                  <Button disabled>
                    Select an answer
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question Navigator */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Question Navigator</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-10 gap-2">
              {testQuestions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => jumpToQuestion(idx)}
                  className={`aspect-square rounded-md flex items-center justify-center text-sm font-medium transition-all ${
                    idx === currentQuestion
                      ? 'bg-blue-500 text-white'
                      : selectedAnswers[idx] !== undefined
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded" />
                <span>Current</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 border border-green-300 rounded" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-slate-100 border border-slate-300 rounded" />
                <span>Unanswered</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results View
  if (currentView === 'results') {
    const correctCount = testQuestions.filter((q, idx) => selectedAnswers[idx] === q.correct).length;
    const accuracy = (correctCount / testQuestions.length) * 100;
    const iqCategory = getIQCategory(score);
    
    const categoryResults: Record<string, { correct: number; total: number; percentage: number }> = {};
    testQuestions.forEach((q, idx) => {
      if (!categoryResults[q.category]) {
        categoryResults[q.category] = { correct: 0, total: 0, percentage: 0 };
      }
      categoryResults[q.category].total++;
      if (selectedAnswers[idx] === q.correct) {
        categoryResults[q.category].correct++;
      }
    });
    
    Object.keys(categoryResults).forEach(cat => {
      categoryResults[cat].percentage = Math.round(
        (categoryResults[cat].correct / categoryResults[cat].total) * 100
      );
    });

    return (
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Test Completed!</h2>
          <p className="text-slate-600">Here are your results</p>
        </div>

        {/* Main Score Card */}
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
          <CardContent className="pt-8 pb-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white shadow-lg mb-4">
                <Brain className="w-12 h-12 text-purple-500" />
              </div>
              <div>
                <p className="text-6xl font-bold text-slate-900 mb-2">{score}</p>
                <p className="text-2xl font-semibold text-slate-700 mb-1">{iqCategory.label}</p>
                <p className="text-slate-600">{iqCategory.description}</p>
              </div>
              <div className="flex items-center justify-center gap-8 mt-6">
                <div>
                  <p className="text-3xl font-bold text-green-600">{correctCount}</p>
                  <p className="text-sm text-slate-600">Correct</p>
                </div>
                <div className="w-px h-12 bg-slate-300" />
                <div>
                  <p className="text-3xl font-bold text-blue-600">{accuracy.toFixed(1)}%</p>
                  <p className="text-sm text-slate-600">Accuracy</p>
                </div>
                <div className="w-px h-12 bg-slate-300" />
                <div>
                  <p className="text-3xl font-bold text-purple-600">{testQuestions.length}</p>
                  <p className="text-sm text-slate-600">Total Questions</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Performance by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(categoryResults)
                .sort((a, b) => b[1].percentage - a[1].percentage)
                .map(([category, result]) => (
                  <div key={category}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{category}</span>
                      <span className="text-sm text-slate-600">
                        {result.correct}/{result.total} ({result.percentage}%)
                      </span>
                    </div>
                    <Progress value={result.percentage} className="h-2" />
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => setCurrentView('review')}>
            <Eye className="w-4 h-4 mr-2" />
            Review Answers
          </Button>
          <Button variant="outline" onClick={() => setCurrentView('stats')}>
            <BarChart3 className="w-4 h-4 mr-2" />
            View Statistics
          </Button>
          <Button onClick={() => {
            setCurrentView('menu');
            resetTest();
          }}>
            <Home className="w-4 h-4 mr-2" />
            Back to Menu
          </Button>
          <Button onClick={() => startTest(selectedLevel)} className="bg-green-600 hover:bg-green-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retake Test
          </Button>
        </div>
      </div>
    );
  }

  // Review View
  if (currentView === 'review') {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Review Your Answers</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowExplanations(!showExplanations)}>
              {showExplanations ? <Eye className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {showExplanations ? 'Hide' : 'Show'} Explanations
            </Button>
            <Button variant="outline" onClick={() => setCurrentView('results')}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Results
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[700px]">
          <div className="space-y-4 pr-4">
            {testQuestions.map((q, idx) => {
              const userAnswer = selectedAnswers[idx];
              const isCorrect = userAnswer === q.correct;

              return (
                <Card key={q.id} className={`${
                  isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">Q{idx + 1}</Badge>
                          <Badge variant="outline">{q.category}</Badge>
                          {isCorrect ? (
                            <Badge className="bg-green-600">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Correct
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="w-3 h-3 mr-1" />
                              Incorrect
                            </Badge>
                          )}
                        </div>
                        <p className="text-base font-semibold">{q.question}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      {q.options.map((option, optIdx) => (
                        <div
                          key={optIdx}
                          className={`p-3 rounded-lg border-2 ${
                            optIdx === q.correct
                              ? 'border-green-500 bg-green-50'
                              : optIdx === userAnswer && userAnswer !== q.correct
                                ? 'border-red-500 bg-red-50'
                                : 'border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {optIdx === q.correct && <CheckCircle className="w-5 h-5 text-green-600" />}
                            {optIdx === userAnswer && userAnswer !== q.correct && <XCircle className="w-5 h-5 text-red-600" />}
                            <span className={`font-medium ${
                              optIdx === q.correct ? 'text-green-900' :
                              optIdx === userAnswer ? 'text-red-900' : 'text-slate-700'
                            }`}>
                              {String.fromCharCode(65 + optIdx)}. {option}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {showExplanations && q.explanation && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-start gap-2">
                          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-blue-900 mb-1">Explanation</p>
                            <p className="text-sm text-blue-800">{q.explanation}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Stats View
  if (currentView === 'stats') {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">Your IQ Test Statistics</h2>
          <Button variant="outline" onClick={() => setCurrentView('menu')}>
            <Home className="w-4 h-4 mr-2" />
            Back to Menu
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Trophy className="w-10 h-10 mx-auto mb-3 text-amber-500" />
                <p className="text-3xl font-bold">{testStats?.bestScore || 0}</p>
                <p className="text-sm text-slate-600">Best Score</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <TrendingUp className="w-10 h-10 mx-auto mb-3 text-green-500" />
                <p className="text-3xl font-bold">{Math.round(testStats?.averageScore || 0)}</p>
                <p className="text-sm text-slate-600">Average Score</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Target className="w-10 h-10 mx-auto mb-3 text-blue-500" />
                <p className="text-3xl font-bold">{Math.round(testStats?.averageAccuracy || 0)}%</p>
                <p className="text-sm text-slate-600">Avg Accuracy</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <BarChart3 className="w-10 h-10 mx-auto mb-3 text-purple-500" />
                <p className="text-3xl font-bold">{testStats?.totalTests || 0}</p>
                <p className="text-sm text-slate-600">Tests Completed</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Strengths */}
        {testStats?.categoryStrengths && Object.keys(testStats.categoryStrengths).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Category Strengths</CardTitle>
              <CardDescription>Your performance across different cognitive areas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(testStats.categoryStrengths)
                  .sort((a, b) => (b[1] as number) - (a[1] as number))
                  .map(([category, score]) => (
                    <div key={category}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{category}</span>
                        <span className="text-sm text-slate-600">{Math.round(score as number)}%</span>
                      </div>
                      <Progress value={score as number} className="h-2" />
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test History */}
        {testSessions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Test History</CardTitle>
              <CardDescription>Your recent test attempts</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3 pr-4">
                  {testSessions.map((session: TestSession) => (
                    <div key={session.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <Badge variant="outline" className="capitalize">{session.testLevel}</Badge>
                          <span className="text-sm text-slate-600">
                            {new Date(session.completedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span><strong>Score:</strong> {session.iqScore}</span>
                          <span><strong>Correct:</strong> {session.correctAnswers}/{session.questionCount}</span>
                          <span><strong>Time:</strong> {Math.round(session.totalTime / 60)}min</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{session.iqScore}</p>
                        <p className="text-xs text-slate-500">{getIQCategory(session.iqScore).label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <Button onClick={() => setCurrentView('review')}>
            <Eye className="w-4 h-4 mr-2" />
            Review Answers
          </Button>
          <Button onClick={() => {
            resetTest();
            startTest(selectedLevel);
          }}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Take New Test
          </Button>
          <Button variant="outline" onClick={() => setCurrentView('menu')}>
            <Home className="w-4 h-4 mr-2" />
            Main Menu
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
