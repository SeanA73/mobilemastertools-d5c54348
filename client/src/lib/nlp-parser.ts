import * as chrono from 'chrono-node';

export interface ParsedTask {
  title: string;
  description?: string;
  dueDate?: Date;
  reminderDate?: Date;
  priority: 'low' | 'medium' | 'high';
  urgency: 'low' | 'medium' | 'high';
  importance: 'low' | 'medium' | 'high';
  tags: string[];
  labels: string[];
  category?: string;
  estimatedDuration?: number;
  isRecurring: boolean;
  recurringPattern?: any;
  originalText: string;
}

export function parseNaturalLanguageTask(input: string): ParsedTask {
  const originalText = input;
  let cleanedInput = input;
  
  // Extract tags (#hashtag) and labels (@mention)
  const tags: string[] = [];
  const labels: string[] = [];
  
  // Extract hashtags
  const hashtagMatches = input.match(/#[\w]+/g);
  if (hashtagMatches) {
    tags.push(...hashtagMatches.map(tag => tag.substring(1)));
    cleanedInput = cleanedInput.replace(/#[\w]+/g, '').trim();
  }
  
  // Extract @mentions as labels
  const mentionMatches = input.match(/@[\w]+/g);
  if (mentionMatches) {
    labels.push(...mentionMatches.map(label => label.substring(1)));
    cleanedInput = cleanedInput.replace(/@[\w]+/g, '').trim();
  }
  
  // Parse dates and times
  const parsedDates = chrono.parse(input);
  let dueDate: Date | undefined;
  let reminderDate: Date | undefined;
  
  if (parsedDates.length > 0) {
    dueDate = parsedDates[0].start.date();
    
    // Check for reminder keywords
    if (input.toLowerCase().includes('remind') && parsedDates.length > 1) {
      reminderDate = parsedDates[1].start.date();
    } else if (input.toLowerCase().includes('remind')) {
      // Set reminder 30 minutes before due date
      reminderDate = new Date(dueDate.getTime() - 30 * 60 * 1000);
    }
    
    // Remove date text from cleaned input
    cleanedInput = cleanedInput.replace(parsedDates[0].text, '').trim();
  }
  
  // Determine priority from keywords
  let priority: 'low' | 'medium' | 'high' = 'medium';
  let urgency: 'low' | 'medium' | 'high' = 'medium';
  let importance: 'low' | 'medium' | 'high' = 'medium';
  
  const lowPriorityKeywords = ['maybe', 'sometime', 'when possible', 'low priority'];
  const highPriorityKeywords = ['urgent', 'asap', 'important', 'critical', 'high priority', 'emergency'];
  
  const inputLower = input.toLowerCase();
  
  if (highPriorityKeywords.some(keyword => inputLower.includes(keyword))) {
    priority = 'high';
    urgency = 'high';
    importance = 'high';
  } else if (lowPriorityKeywords.some(keyword => inputLower.includes(keyword))) {
    priority = 'low';
    urgency = 'low';
    importance = 'low';
  }
  
  // Extract duration estimates
  let estimatedDuration: number | undefined;
  const durationMatches = input.match(/(\d+)\s*(minute|min|hour|hr)s?/i);
  if (durationMatches) {
    const value = parseInt(durationMatches[1]);
    const unit = durationMatches[2].toLowerCase();
    estimatedDuration = unit.startsWith('hour') || unit.startsWith('hr') ? value * 60 : value;
    cleanedInput = cleanedInput.replace(durationMatches[0], '').trim();
  }
  
  // Detect recurring patterns
  let isRecurring = false;
  let recurringPattern: any = undefined;
  
  const recurringKeywords = ['daily', 'weekly', 'monthly', 'yearly', 'every'];
  if (recurringKeywords.some(keyword => inputLower.includes(keyword))) {
    isRecurring = true;
    
    if (inputLower.includes('daily') || inputLower.includes('every day')) {
      recurringPattern = { type: 'daily', interval: 1 };
    } else if (inputLower.includes('weekly') || inputLower.includes('every week')) {
      recurringPattern = { type: 'weekly', interval: 1 };
    } else if (inputLower.includes('monthly') || inputLower.includes('every month')) {
      recurringPattern = { type: 'monthly', interval: 1 };
    } else if (inputLower.includes('every other')) {
      if (inputLower.includes('day')) {
        recurringPattern = { type: 'daily', interval: 2 };
      } else if (inputLower.includes('week')) {
        recurringPattern = { type: 'weekly', interval: 2 };
      }
    }
  }
  
  // Determine category based on keywords
  let category: string | undefined;
  const workKeywords = ['meeting', 'call', 'project', 'work', 'office', 'client'];
  const personalKeywords = ['home', 'family', 'personal', 'buy', 'grocery'];
  const healthKeywords = ['doctor', 'gym', 'exercise', 'health', 'appointment'];
  
  if (workKeywords.some(keyword => inputLower.includes(keyword))) {
    category = 'work';
  } else if (personalKeywords.some(keyword => inputLower.includes(keyword))) {
    category = 'personal';
  } else if (healthKeywords.some(keyword => inputLower.includes(keyword))) {
    category = 'health';
  }
  
  // Clean up the title
  let title = cleanedInput;
  
  // Remove priority keywords from title
  const allPriorityKeywords = [...lowPriorityKeywords, ...highPriorityKeywords];
  allPriorityKeywords.forEach(keyword => {
    title = title.replace(new RegExp(keyword, 'gi'), '').trim();
  });
  
  // Remove recurring keywords from title
  recurringKeywords.forEach(keyword => {
    title = title.replace(new RegExp(`\\b${keyword}\\b`, 'gi'), '').trim();
  });
  
  // Clean up extra spaces
  title = title.replace(/\s+/g, ' ').trim();
  
  return {
    title: title || 'New Task',
    priority,
    urgency,
    importance,
    tags,
    labels,
    category,
    dueDate,
    reminderDate,
    estimatedDuration,
    isRecurring,
    recurringPattern,
    originalText
  };
}

export function formatRecurringPattern(pattern: any): string {
  if (!pattern) return '';
  
  const { type, interval } = pattern;
  
  if (interval === 1) {
    return `Every ${type.slice(0, -2)}`;
  } else {
    return `Every ${interval} ${type}`;
  }
}