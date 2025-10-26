export interface RecurringPattern {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  interval: number;
  daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, etc.
  dayOfMonth?: number;
  weekOfMonth?: number; // 1 = first week, 2 = second week, etc.
  monthOfYear?: number; // 1 = January, 2 = February, etc.
  endType?: 'never' | 'after' | 'on';
  endCount?: number;
  endDate?: Date;
}

export function parseRecurringText(text: string): RecurringPattern | null {
  const lowerText = text.toLowerCase();
  
  // Daily patterns
  if (lowerText.includes('daily') || lowerText.includes('every day')) {
    return { type: 'daily', interval: 1 };
  }
  
  if (lowerText.includes('every other day')) {
    return { type: 'daily', interval: 2 };
  }
  
  // Weekly patterns
  if (lowerText.includes('weekly') || lowerText.includes('every week')) {
    return { type: 'weekly', interval: 1 };
  }
  
  if (lowerText.includes('every other week') || lowerText.includes('biweekly')) {
    return { type: 'weekly', interval: 2 };
  }
  
  // Specific day patterns
  const dayPatterns = {
    'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4,
    'friday': 5, 'saturday': 6, 'sunday': 0
  };
  
  for (const [day, dayNum] of Object.entries(dayPatterns)) {
    if (lowerText.includes(`every ${day}`)) {
      return { type: 'weekly', interval: 1, daysOfWeek: [dayNum] };
    }
    if (lowerText.includes(`every other ${day}`)) {
      return { type: 'weekly', interval: 2, daysOfWeek: [dayNum] };
    }
  }
  
  // Monthly patterns
  if (lowerText.includes('monthly') || lowerText.includes('every month')) {
    return { type: 'monthly', interval: 1 };
  }
  
  if (lowerText.includes('first monday of the month') || lowerText.includes('first monday of each month')) {
    return { type: 'monthly', interval: 1, daysOfWeek: [1], weekOfMonth: 1 };
  }
  
  if (lowerText.includes('last friday of the month') || lowerText.includes('last friday of each month')) {
    return { type: 'monthly', interval: 1, daysOfWeek: [5], weekOfMonth: -1 };
  }
  
  // After X completions
  const afterMatch = lowerText.match(/after (\d+) completion/);
  if (afterMatch) {
    return { type: 'custom', interval: 1, endType: 'after', endCount: parseInt(afterMatch[1]) };
  }
  
  return null;
}

export function formatRecurringPattern(pattern: RecurringPattern): string {
  if (!pattern) return '';
  
  const { type, interval, daysOfWeek, weekOfMonth, endType, endCount } = pattern;
  
  let result = '';
  
  switch (type) {
    case 'daily':
      result = interval === 1 ? 'Daily' : `Every ${interval} days`;
      break;
      
    case 'weekly':
      if (daysOfWeek && daysOfWeek.length === 1) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = days[daysOfWeek[0]];
        result = interval === 1 ? `Every ${dayName}` : `Every ${interval} weeks on ${dayName}`;
      } else {
        result = interval === 1 ? 'Weekly' : `Every ${interval} weeks`;
      }
      break;
      
    case 'monthly':
      if (daysOfWeek && weekOfMonth) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = days[daysOfWeek[0]];
        const weekNames = ['', 'First', 'Second', 'Third', 'Fourth'];
        const weekName = weekOfMonth === -1 ? 'Last' : weekNames[weekOfMonth];
        result = `${weekName} ${dayName} of each month`;
      } else {
        result = interval === 1 ? 'Monthly' : `Every ${interval} months`;
      }
      break;
      
    case 'yearly':
      result = interval === 1 ? 'Yearly' : `Every ${interval} years`;
      break;
      
    case 'custom':
      if (endType === 'after' && endCount) {
        result = `After ${endCount} completions`;
      } else {
        result = 'Custom pattern';
      }
      break;
  }
  
  if (endType === 'after' && endCount && type !== 'custom') {
    result += ` (${endCount} times)`;
  }
  
  return result;
}

export function getNextDueDate(pattern: RecurringPattern, lastDate: Date): Date {
  const next = new Date(lastDate);
  
  switch (pattern.type) {
    case 'daily':
      next.setDate(next.getDate() + pattern.interval);
      break;
      
    case 'weekly':
      next.setDate(next.getDate() + (7 * pattern.interval));
      break;
      
    case 'monthly':
      next.setMonth(next.getMonth() + pattern.interval);
      break;
      
    case 'yearly':
      next.setFullYear(next.getFullYear() + pattern.interval);
      break;
  }
  
  return next;
}