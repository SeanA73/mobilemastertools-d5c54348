import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Copy, RefreshCw, Key, Shield, Eye, EyeOff, Download, Upload, 
  History, Settings, Zap, Lock, AlertTriangle, CheckCircle2, 
  Sparkles, Hash, FileText, List, TrendingUp, Award, Database,
  Save, Trash2, Info, Target, Cpu, BarChart3, ShieldAlert, Clock
} from "lucide-react";

type GenerationMode = "random" | "memorable" | "passphrase" | "pin" | "pattern";
type PasswordTemplate = "website" | "banking" | "email" | "wifi" | "database" | "admin" | "custom";

interface PasswordEntry {
  password: string;
  strength: number;
  timestamp: number;
  mode: GenerationMode;
  label?: string;
}

interface StrengthAnalysis {
  score: number;
  level: string;
  color: string;
  entropy: number;
  timeTocrack: string;
  issues: string[];
  suggestions: string[];
}

// Common weak passwords for breach checking
const COMMON_PASSWORDS = [
  "password", "123456", "12345678", "qwerty", "abc123", "monkey", "1234567", "letmein",
  "trustno1", "dragon", "baseball", "iloveyou", "master", "sunshine", "ashley", "bailey",
  "passw0rd", "shadow", "123123", "654321", "superman", "password1", "admin", "welcome"
];

// Word lists for memorable passwords
const ADJECTIVES = [
  "Happy", "Quick", "Bright", "Silent", "Mighty", "Swift", "Brave", "Clever",
  "Gentle", "Noble", "Proud", "Calm", "Wild", "Bold", "Grand", "Wise"
];

const NOUNS = [
  "Tiger", "Eagle", "Dragon", "Phoenix", "Wolf", "Lion", "Hawk", "Bear",
  "Falcon", "Panther", "Storm", "Thunder", "River", "Mountain", "Ocean", "Forest"
];

const WORDS_FOR_PASSPHRASE = [
  "correct", "horse", "battery", "staple", "coffee", "cloud", "mountain", "river",
  "sunset", "ocean", "forest", "thunder", "crystal", "diamond", "silver", "golden",
  "purple", "orange", "galaxy", "planet", "rocket", "wizard", "knight", "castle",
  "dragon", "phoenix", "tiger", "eagle", "falcon", "warrior", "legend", "magic"
];

export default function PasswordGeneratorTool() {
  const [mode, setMode] = useState<GenerationMode>("random");
  const [password, setPassword] = useState("");
  const [length, setLength] = useState([16]);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [excludeSimilar, setExcludeSimilar] = useState(false);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [showPassword, setShowPassword] = useState(true);
  const [customCharset, setCustomCharset] = useState("");
  const [useCustomCharset, setUseCustomCharset] = useState(false);
  
  // Memorable password settings
  const [wordCount, setWordCount] = useState([4]);
  const [separator, setSeparator] = useState("-");
  const [capitalize, setCapitalize] = useState(true);
  const [addNumbers, setAddNumbers] = useState(true);
  
  // PIN settings
  const [pinLength, setPinLength] = useState([6]);
  
  // Pattern settings
  const [pattern, setPattern] = useState("ULNNS");
  
  // Bulk generation
  const [bulkCount, setBulkCount] = useState(10);
  const [bulkPasswords, setBulkPasswords] = useState<string[]>([]);
  
  // History
  const [history, setHistory] = useState<PasswordEntry[]>([]);
  const [savedPasswords, setSavedPasswords] = useState<PasswordEntry[]>([]);
  
  // Template
  const [template, setTemplate] = useState<PasswordTemplate>("website");
  
  const { toast } = useToast();

  // Calculate entropy
  const calculateEntropy = (pwd: string, charsetSize: number): number => {
    return Math.log2(Math.pow(charsetSize, pwd.length));
  };

  // Time to crack estimation
  const getTimeTocrack = (entropy: number): string => {
    const guessesPerSecond = 1e9; // 1 billion guesses per second
    const possibleCombinations = Math.pow(2, entropy);
    const seconds = possibleCombinations / (2 * guessesPerSecond);
    
    if (seconds < 1) return "Instantly";
    if (seconds < 60) return `${Math.round(seconds)} seconds`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
    if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`;
    if (seconds < 31536000 * 100) return `${Math.round(seconds / 31536000)} years`;
    if (seconds < 31536000 * 1000000) return `${Math.round(seconds / 31536000 / 1000)} thousand years`;
    if (seconds < 31536000 * 1000000000) return `${Math.round(seconds / 31536000 / 1000000)} million years`;
    return "Billions of years";
  };

  // Analyze password strength
  const analyzePassword = (pwd: string): StrengthAnalysis => {
    if (!pwd) {
      return {
        score: 0,
        level: "None",
        color: "gray",
        entropy: 0,
        timeTocrack: "N/A",
        issues: [],
        suggestions: []
      };
    }

    const issues: string[] = [];
    const suggestions: string[] = [];
    let charsetSize = 0;
    
    // Check character types
    const hasLower = /[a-z]/.test(pwd);
    const hasUpper = /[A-Z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSymbol = /[^A-Za-z0-9]/.test(pwd);
    
    if (hasLower) charsetSize += 26;
    if (hasUpper) charsetSize += 26;
    if (hasNumber) charsetSize += 10;
    if (hasSymbol) charsetSize += 32;
    
    // Calculate entropy
    const entropy = calculateEntropy(pwd, charsetSize);
    const timeTocrack = getTimeTocrack(entropy);
    
    // Check for common passwords
    if (COMMON_PASSWORDS.includes(pwd.toLowerCase())) {
      issues.push("This is a commonly used password");
      suggestions.push("Use a unique, random password");
    }
    
    // Check length
    if (pwd.length < 8) {
      issues.push("Password is too short");
      suggestions.push("Use at least 12 characters");
    } else if (pwd.length < 12) {
      issues.push("Password could be longer");
      suggestions.push("Use 16+ characters for better security");
    }
    
    // Check character diversity
    let varietyCount = 0;
    if (hasLower) varietyCount++;
    if (hasUpper) varietyCount++;
    if (hasNumber) varietyCount++;
    if (hasSymbol) varietyCount++;
    
    if (varietyCount < 3) {
      issues.push("Limited character variety");
      suggestions.push("Include uppercase, lowercase, numbers, and symbols");
    }
    
    // Check for patterns
    if (/(.)\1{2,}/.test(pwd)) {
      issues.push("Contains repeated characters");
      suggestions.push("Avoid repeated sequences");
    }
    
    if (/012|123|234|345|456|567|678|789|890/.test(pwd)) {
      issues.push("Contains sequential numbers");
      suggestions.push("Avoid predictable sequences");
    }
    
    if (/abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i.test(pwd)) {
      issues.push("Contains sequential letters");
      suggestions.push("Use random character combinations");
    }
    
    // Calculate score
    let score = 0;
    if (pwd.length >= 8) score += 20;
    if (pwd.length >= 12) score += 20;
    if (pwd.length >= 16) score += 20;
    if (hasLower) score += 10;
    if (hasUpper) score += 10;
    if (hasNumber) score += 10;
    if (hasSymbol) score += 10;
    
    score -= issues.length * 5;
    score = Math.max(0, Math.min(100, score));
    
    let level = "Weak";
    let color = "red";
    
    if (score >= 80) {
      level = "Very Strong";
      color = "green";
    } else if (score >= 60) {
      level = "Strong";
      color = "blue";
    } else if (score >= 40) {
      level = "Medium";
      color = "yellow";
    } else if (score >= 20) {
      level = "Weak";
      color = "orange";
    } else {
      level = "Very Weak";
      color = "red";
    }
    
    return {
      score,
      level,
      color,
      entropy: Math.round(entropy),
      timeTocrack,
      issues,
      suggestions
    };
  };

  // Generate random password
  const generateRandomPassword = (): string => {
    let charset = "";
    
    if (useCustomCharset && customCharset) {
      charset = customCharset;
    } else {
      if (includeLowercase) charset += "abcdefghijklmnopqrstuvwxyz";
      if (includeUppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      if (includeNumbers) charset += "0123456789";
      if (includeSymbols) charset += "!@#$%^&*()_+-=[]{}|;:,.<>?/~`";
      
      if (excludeSimilar) {
        charset = charset.replace(/[il1Lo0O]/g, "");
      }
      
      if (excludeAmbiguous) {
        charset = charset.replace(/[{}[\]()\/\\'"~,;:.<>]/g, "");
      }
    }
    
    if (!charset) {
      toast({
        title: "Error",
        description: "Please select at least one character type",
        variant: "destructive",
      });
      return "";
    }
    
    const array = new Uint32Array(length[0]);
    crypto.getRandomValues(array);
    
    let pwd = "";
    for (let i = 0; i < length[0]; i++) {
      pwd += charset[array[i] % charset.length];
    }
    
    return pwd;
  };

  // Generate memorable password
  const generateMemorablePassword = (): string => {
    const parts: string[] = [];
    
    for (let i = 0; i < 2; i++) {
      const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
      const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
      parts.push(capitalize ? adj : adj.toLowerCase());
      parts.push(capitalize ? noun : noun.toLowerCase());
    }
    
    let pwd = parts.join(separator);
    
    if (addNumbers) {
      const num = Math.floor(Math.random() * 1000);
      pwd += separator + num;
    }
    
    return pwd;
  };

  // Generate passphrase
  const generatePassphrase = (): string => {
    const words: string[] = [];
    
    for (let i = 0; i < wordCount[0]; i++) {
      const word = WORDS_FOR_PASSPHRASE[Math.floor(Math.random() * WORDS_FOR_PASSPHRASE.length)];
      words.push(capitalize ? word.charAt(0).toUpperCase() + word.slice(1) : word);
    }
    
    let pwd = words.join(separator);
    
    if (addNumbers) {
      const num = Math.floor(Math.random() * 100);
      pwd += separator + num;
    }
    
    return pwd;
  };

  // Generate PIN
  const generatePIN = (): string => {
    let pin = "";
    for (let i = 0; i < pinLength[0]; i++) {
      pin += Math.floor(Math.random() * 10);
    }
    return pin;
  };

  // Generate pattern-based password
  const generatePatternPassword = (): string => {
    const charSets: { [key: string]: string } = {
      'U': 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      'L': 'abcdefghijklmnopqrstuvwxyz',
      'N': '0123456789',
      'S': '!@#$%^&*()_+-=[]{}|;:,.<>?',
      'A': 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    };
    
    let pwd = "";
    for (const char of pattern.toUpperCase()) {
      const charset = charSets[char] || charSets['A'];
      pwd += charset[Math.floor(Math.random() * charset.length)];
    }
    
    return pwd;
  };

  // Apply template settings
  const applyTemplate = (temp: PasswordTemplate) => {
    switch (temp) {
      case "website":
        setLength([16]);
        setIncludeUppercase(true);
        setIncludeLowercase(true);
        setIncludeNumbers(true);
        setIncludeSymbols(true);
        setExcludeSimilar(true);
        setMode("random");
        break;
      case "banking":
        setLength([20]);
        setIncludeUppercase(true);
        setIncludeLowercase(true);
        setIncludeNumbers(true);
        setIncludeSymbols(true);
        setExcludeSimilar(true);
        setExcludeAmbiguous(true);
        setMode("random");
        break;
      case "email":
        setLength([18]);
        setIncludeUppercase(true);
        setIncludeLowercase(true);
        setIncludeNumbers(true);
        setIncludeSymbols(false);
        setMode("random");
        break;
      case "wifi":
        setWordCount([4]);
        setSeparator("-");
        setCapitalize(true);
        setAddNumbers(true);
        setMode("passphrase");
        break;
      case "database":
        setLength([24]);
        setIncludeUppercase(true);
        setIncludeLowercase(true);
        setIncludeNumbers(true);
        setIncludeSymbols(true);
        setMode("random");
        break;
      case "admin":
        setLength([32]);
        setIncludeUppercase(true);
        setIncludeLowercase(true);
        setIncludeNumbers(true);
        setIncludeSymbols(true);
        setMode("random");
        break;
    }
  };

  // Main generate function
  const generatePassword = () => {
    let newPassword = "";
    
    switch (mode) {
      case "random":
        newPassword = generateRandomPassword();
        break;
      case "memorable":
        newPassword = generateMemorablePassword();
        break;
      case "passphrase":
        newPassword = generatePassphrase();
        break;
      case "pin":
        newPassword = generatePIN();
        break;
      case "pattern":
        newPassword = generatePatternPassword();
        break;
    }
    
    if (newPassword) {
      setPassword(newPassword);
      
      // Add to history
      const entry: PasswordEntry = {
        password: newPassword,
        strength: analyzePassword(newPassword).score,
        timestamp: Date.now(),
        mode
      };
      
      setHistory(prev => [entry, ...prev.slice(0, 19)]);
    }
  };

  // Bulk generation
  const generateBulk = () => {
    const passwords: string[] = [];
    for (let i = 0; i < bulkCount; i++) {
      let pwd = "";
      switch (mode) {
        case "random":
          pwd = generateRandomPassword();
          break;
        case "memorable":
          pwd = generateMemorablePassword();
          break;
        case "passphrase":
          pwd = generatePassphrase();
          break;
        case "pin":
          pwd = generatePIN();
          break;
        case "pattern":
          pwd = generatePatternPassword();
          break;
      }
      if (pwd) passwords.push(pwd);
    }
    setBulkPasswords(passwords);
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Password copied to clipboard",
    });
  };

  // Export passwords
  const exportPasswords = () => {
    const data = {
      generated: new Date().toISOString(),
      passwords: bulkPasswords.length > 0 ? bulkPasswords : [password],
      history: history.slice(0, 10)
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `passwords-${Date.now()}.json`;
    a.click();
    
    toast({
      title: "Exported!",
      description: "Passwords exported successfully",
    });
  };

  // Save password
  const savePassword = (pwd: string, label?: string) => {
    const entry: PasswordEntry = {
      password: pwd,
      strength: analyzePassword(pwd).score,
      timestamp: Date.now(),
      mode,
      label
    };
    
    setSavedPasswords(prev => [entry, ...prev]);
    
    toast({
      title: "Saved!",
      description: "Password saved to your collection",
    });
  };

  const strength = useMemo(() => analyzePassword(password), [password]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Lock className="w-8 h-8 text-blue-500" />
            Advanced Password Generator
          </h2>
          <p className="text-slate-600 mt-1">
            Generate ultra-secure passwords with advanced customization
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Templates
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Password Templates</DialogTitle>
                <DialogDescription>Quick presets for common scenarios</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "website", name: "Website Login", icon: "🌐", desc: "16 chars, mixed" },
                  { id: "banking", name: "Banking", icon: "🏦", desc: "20 chars, ultra-secure" },
                  { id: "email", name: "Email Account", icon: "📧", desc: "18 chars, no symbols" },
                  { id: "wifi", name: "WiFi Password", icon: "📶", desc: "Passphrase, easy to type" },
                  { id: "database", name: "Database", icon: "💾", desc: "24 chars, very strong" },
                  { id: "admin", name: "Admin/Root", icon: "👑", desc: "32 chars, maximum security" }
                ].map((t) => (
                  <Button
                    key={t.id}
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-start"
                    onClick={() => {
                      setTemplate(t.id as PasswordTemplate);
                      applyTemplate(t.id as PasswordTemplate);
                    }}
                  >
                    <div className="text-2xl mb-1">{t.icon}</div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.desc}</div>
                  </Button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={mode} onValueChange={(v) => setMode(v as GenerationMode)} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="random">
            <Zap className="w-4 h-4 mr-2" />
            Random
          </TabsTrigger>
          <TabsTrigger value="memorable">
            <Sparkles className="w-4 h-4 mr-2" />
            Memorable
          </TabsTrigger>
          <TabsTrigger value="passphrase">
            <FileText className="w-4 h-4 mr-2" />
            Passphrase
          </TabsTrigger>
          <TabsTrigger value="pin">
            <Hash className="w-4 h-4 mr-2" />
            PIN
          </TabsTrigger>
          <TabsTrigger value="pattern">
            <Target className="w-4 h-4 mr-2" />
            Pattern
          </TabsTrigger>
        </TabsList>

        {/* Random Mode */}
        <TabsContent value="random" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Settings */}
            <Card className="lg:col-span-1">
          <CardHeader>
                <CardTitle className="text-lg">Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
                  <Label>Length: {length[0]} characters</Label>
              <Slider
                value={length}
                onValueChange={setLength}
                    max={128}
                min={4}
                step={1}
              />
            </div>

                <Separator />
              
              <div className="space-y-3">
                  <Label className="text-base">Character Types</Label>
                  
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="uppercase"
                    checked={includeUppercase}
                    onCheckedChange={(checked) => setIncludeUppercase(checked === true)}
                  />
                    <Label htmlFor="uppercase" className="font-normal">
                      Uppercase (A-Z)
                    </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="lowercase"
                    checked={includeLowercase}
                    onCheckedChange={(checked) => setIncludeLowercase(checked === true)}
                  />
                    <Label htmlFor="lowercase" className="font-normal">
                      Lowercase (a-z)
                    </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="numbers"
                    checked={includeNumbers}
                    onCheckedChange={(checked) => setIncludeNumbers(checked === true)}
                  />
                    <Label htmlFor="numbers" className="font-normal">
                      Numbers (0-9)
                    </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="symbols"
                    checked={includeSymbols}
                    onCheckedChange={(checked) => setIncludeSymbols(checked === true)}
                  />
                    <Label htmlFor="symbols" className="font-normal">
                      Symbols (!@#$...)
                    </Label>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-base">Options</Label>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="exclude-similar"
                    checked={excludeSimilar}
                    onCheckedChange={(checked) => setExcludeSimilar(checked === true)}
                  />
                    <Label htmlFor="exclude-similar" className="font-normal text-sm">
                      Exclude similar (i, l, 1, O, 0)
                    </Label>
                </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="exclude-ambiguous"
                      checked={excludeAmbiguous}
                      onCheckedChange={(checked) => setExcludeAmbiguous(checked === true)}
                    />
                    <Label htmlFor="exclude-ambiguous" className="font-normal text-sm">
                      Exclude ambiguous ({`{ } [ ] ( ) / \\ ' " ~`})
                    </Label>
              </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="custom-charset"
                      checked={useCustomCharset}
                      onCheckedChange={(checked) => setUseCustomCharset(checked === true)}
                    />
                    <Label htmlFor="custom-charset" className="font-normal text-sm">
                      Use custom character set
                    </Label>
                  </div>
                  
                  {useCustomCharset && (
                    <Input
                      placeholder="Enter custom characters..."
                      value={customCharset}
                      onChange={(e) => setCustomCharset(e.target.value)}
                      className="font-mono"
                    />
                  )}
            </div>

            <Button onClick={generatePassword} className="w-full" size="lg">
              <RefreshCw className="w-5 h-5 mr-2" />
              Generate Password
            </Button>
          </CardContent>
        </Card>

            {/* Result & Analysis */}
            <Card className="lg:col-span-2">
          <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5" />
                  Generated Password
            </CardTitle>
          </CardHeader>
              <CardContent className="space-y-6">
            {password ? (
              <>
                    {/* Password Display */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Your Password</Label>
                        <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                        </div>
                  </div>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      readOnly
                          className="font-mono text-lg pr-24 h-14"
                    />
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(password)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => savePassword(password)}
                          >
                            <Save className="w-4 h-4" />
                          </Button>
                        </div>
                  </div>
                </div>

                    {/* Strength Analysis */}
                    <div className="space-y-4 p-4 bg-slate-50 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Password Strength</span>
                    <Badge 
                      className={
                            strength.color === "green" ? "bg-green-500" :
                            strength.color === "blue" ? "bg-blue-500" :
                            strength.color === "yellow" ? "bg-yellow-500" :
                            strength.color === "orange" ? "bg-orange-500" :
                            "bg-red-500"
                      }
                    >
                      {strength.level}
                    </Badge>
                      </div>
                      
                      <Progress value={strength.score} className="h-3" />
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-slate-500" />
                          <span className="text-slate-600">Entropy:</span>
                          <span className="font-bold">{strength.entropy} bits</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-500" />
                          <span className="text-slate-600">Time to crack:</span>
                          <span className="font-bold">{strength.timeTocrack}</span>
                        </div>
                      </div>

                      {strength.issues.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium text-orange-700">
                            <AlertTriangle className="w-4 h-4" />
                            Security Issues
                          </div>
                          <ul className="space-y-1 text-sm text-slate-700">
                            {strength.issues.map((issue, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-orange-500">•</span>
                                {issue}
                              </li>
                            ))}
                          </ul>
                  </div>
                )}

                      {strength.suggestions.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
                            <Info className="w-4 h-4" />
                            Suggestions
                          </div>
                          <ul className="space-y-1 text-sm text-slate-700">
                            {strength.suggestions.map((suggestion, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-blue-500">•</span>
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Breach Check */}
                      {COMMON_PASSWORDS.includes(password.toLowerCase()) ? (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                          <ShieldAlert className="w-4 h-4" />
                          <span className="font-medium">Warning: This password appears in common password lists!</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="font-medium">This password doesn't appear in common password lists</span>
                        </div>
                      )}
                    </div>
              </>
            ) : (
                  <div className="text-center py-12 text-slate-500">
                    <Lock className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <p className="text-lg">Click "Generate Password" to create a secure password</p>
              </div>
            )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Memorable Mode */}
        <TabsContent value="memorable" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Memorable Settings</CardTitle>
                <CardDescription>Easy to remember, hard to crack</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
              <div className="space-y-2">
                  <Label>Separator</Label>
                  <Input
                    value={separator}
                    onChange={(e) => setSeparator(e.target.value)}
                    placeholder="-"
                    maxLength={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="capitalize-memorable"
                    checked={capitalize}
                    onCheckedChange={(checked) => setCapitalize(checked === true)}
                  />
                  <Label htmlFor="capitalize-memorable">Capitalize words</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="add-numbers-memorable"
                    checked={addNumbers}
                    onCheckedChange={(checked) => setAddNumbers(checked === true)}
                  />
                  <Label htmlFor="add-numbers-memorable">Add numbers</Label>
                </div>

                <Button onClick={generatePassword} className="w-full" size="lg">
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Generate
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Result</CardTitle>
              </CardHeader>
              <CardContent>
                {password ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        readOnly
                        className="font-mono text-lg pr-24 h-14"
                      />
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(password)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className={
                        strength.color === "green" ? "bg-green-500 text-white" :
                        strength.color === "blue" ? "bg-blue-500 text-white" :
                        strength.color === "yellow" ? "bg-yellow-500 text-white" :
                        strength.color === "orange" ? "bg-orange-500 text-white" :
                        "bg-red-500 text-white"
                      }>
                        {strength.level}
                      </Badge>
                      <span className="text-sm text-slate-600">
                        {strength.entropy} bits entropy • Crack time: {strength.timeTocrack}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <p>Click Generate to create a memorable password</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Passphrase Mode */}
        <TabsContent value="passphrase" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Passphrase Settings</CardTitle>
                <CardDescription>XKCD-style word combinations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Number of words: {wordCount[0]}</Label>
                  <Slider
                    value={wordCount}
                    onValueChange={setWordCount}
                    max={8}
                    min={2}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Separator</Label>
                  <Input
                    value={separator}
                    onChange={(e) => setSeparator(e.target.value)}
                    placeholder="-"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="capitalize-passphrase"
                    checked={capitalize}
                    onCheckedChange={(checked) => setCapitalize(checked === true)}
                  />
                  <Label htmlFor="capitalize-passphrase">Capitalize first letter</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="add-numbers-passphrase"
                    checked={addNumbers}
                    onCheckedChange={(checked) => setAddNumbers(checked === true)}
                  />
                  <Label htmlFor="add-numbers-passphrase">Add number at end</Label>
                </div>

                <Button onClick={generatePassword} className="w-full" size="lg">
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Generate
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Result</CardTitle>
              </CardHeader>
              <CardContent>
                {password ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        readOnly
                        className="font-mono text-lg pr-24 h-14"
                      />
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(password)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-sm text-blue-900">
                        <strong>Easy to remember:</strong> Passphrases are easier to type and remember than random characters
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className={
                        strength.color === "green" ? "bg-green-500 text-white" :
                        strength.color === "blue" ? "bg-blue-500 text-white" :
                        strength.color === "yellow" ? "bg-yellow-500 text-white" :
                        strength.color === "orange" ? "bg-orange-500 text-white" :
                        "bg-red-500 text-white"
                      }>
                        {strength.level}
                      </Badge>
                      <span className="text-sm text-slate-600">
                        {strength.entropy} bits entropy
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <p>Click Generate to create a passphrase</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* PIN Mode */}
        <TabsContent value="pin" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">PIN Settings</CardTitle>
                <CardDescription>Numeric PIN codes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>PIN Length: {pinLength[0]} digits</Label>
                  <Slider
                    value={pinLength}
                    onValueChange={setPinLength}
                    max={12}
                    min={4}
                    step={1}
                  />
                </div>

                <Button onClick={generatePassword} className="w-full" size="lg">
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Generate PIN
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Result</CardTitle>
              </CardHeader>
              <CardContent>
                {password ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        readOnly
                        className="font-mono text-2xl tracking-widest pr-24 h-16 text-center"
                      />
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(password)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="text-sm text-yellow-900">
                        <strong>Warning:</strong> PINs are less secure than passwords. Use only when required (phone, card, etc.)
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <p>Click Generate to create a PIN</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Pattern Mode */}
        <TabsContent value="pattern" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pattern Settings</CardTitle>
                <CardDescription>Custom character patterns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Pattern</Label>
                  <Input
                    value={pattern}
                    onChange={(e) => setPattern(e.target.value.toUpperCase())}
                    placeholder="ULNNS"
                    className="font-mono"
                  />
                  <div className="text-xs text-slate-600 space-y-1">
                    <div>U = Uppercase letter</div>
                    <div>L = Lowercase letter</div>
                    <div>N = Number</div>
                    <div>S = Symbol</div>
                    <div>A = Any character</div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border rounded text-sm">
                  <strong>Example:</strong> ULLNNS = ABc12#$
                </div>

                <Button onClick={generatePassword} className="w-full" size="lg">
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Generate
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Result</CardTitle>
              </CardHeader>
              <CardContent>
                {password ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        readOnly
                        className="font-mono text-lg pr-24 h-14"
                      />
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(password)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className={
                        strength.color === "green" ? "bg-green-500 text-white" :
                        strength.color === "blue" ? "bg-blue-500 text-white" :
                        strength.color === "yellow" ? "bg-yellow-500 text-white" :
                        strength.color === "orange" ? "bg-orange-500 text-white" :
                        "bg-red-500 text-white"
                      }>
                        {strength.level}
                      </Badge>
                      <span className="text-sm text-slate-600">
                        Pattern: {pattern}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <p>Click Generate to create a password from pattern</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Bulk Generation & History */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Bulk Generation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List className="w-5 h-5" />
              Bulk Generation
            </CardTitle>
            <CardDescription>Generate multiple passwords at once</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label>Number of passwords</Label>
                <Input
                  type="number"
                  value={bulkCount}
                  onChange={(e) => setBulkCount(parseInt(e.target.value) || 10)}
                  min={1}
                  max={100}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={generateBulk}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Generate
                </Button>
              </div>
            </div>

            {bulkPasswords.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Generated Passwords ({bulkPasswords.length})</Label>
                  <Button variant="outline" size="sm" onClick={exportPasswords}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2 border rounded p-2">
                  {bulkPasswords.map((pwd, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded text-sm">
                      <code className="font-mono flex-1 truncate">
                        {showPassword ? pwd : "•".repeat(pwd.length)}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(pwd)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Password History
            </CardTitle>
            <CardDescription>Recently generated passwords</CardDescription>
          </CardHeader>
          <CardContent>
            {history.length > 0 ? (
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {history.map((entry, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded border">
                    <div className="flex-1 min-w-0 mr-3">
                      <code className="text-sm font-mono block truncate">
                        {showPassword ? entry.password : "•".repeat(entry.password.length)}
                      </code>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {entry.mode}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(entry.password)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <History className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">No passwords generated yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Security Tips */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            Password Security Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Do's
              </h4>
              <ul className="space-y-1 text-slate-700">
                <li>✓ Use 16+ characters for important accounts</li>
                <li>✓ Include uppercase, lowercase, numbers & symbols</li>
                <li>✓ Use unique passwords for each account</li>
                <li>✓ Use a password manager</li>
                <li>✓ Enable two-factor authentication (2FA)</li>
                <li>✓ Update passwords regularly</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-red-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Don'ts
              </h4>
              <ul className="space-y-1 text-slate-700">
                <li>✗ Never reuse passwords</li>
                <li>✗ Don't use personal information</li>
                <li>✗ Avoid common words or patterns</li>
                <li>✗ Don't share passwords</li>
                <li>✗ Never email passwords</li>
                <li>✗ Don't write them on paper</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-green-900 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Pro Tips
              </h4>
              <ul className="space-y-1 text-slate-700">
                <li>💡 Use passphrases for memorable security</li>
                <li>💡 Store passwords in encrypted manager</li>
                <li>💡 Check for breached passwords</li>
                <li>💡 Use different emails for sensitive accounts</li>
                <li>💡 Review account security settings</li>
                <li>💡 Monitor for suspicious activity</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
