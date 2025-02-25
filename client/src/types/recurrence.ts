export type RecurrenceFrequency = "none" | "daily" | "weekly" | "monthly" | "yearly";
export type RecurrenceType = "pre-generated" | "on-completion";

export interface RecurrencePattern {
  type: RecurrenceType;
  frequency: RecurrenceFrequency;
  interval: number;  // e.g., every 2 weeks
  endDate?: string;  // ISO date string
  parentId?: string; // Links recurrence instances
  daysOfWeek?: number[];  // 0-6 for weekly recurrence
  dayOfMonth?: number;    // 1-31 for monthly recurrence
  monthOfYear?: number;   // 0-11 for yearly recurrence
}

export function getNextOccurrence(
  startDate: Date,
  pattern: RecurrencePattern
): Date | null {
  if (pattern.frequency === "none") return null;
  
  const next = new Date(startDate);
  
  switch (pattern.frequency) {
    case "daily":
      next.setDate(next.getDate() + pattern.interval);
      break;
    case "weekly":
      next.setDate(next.getDate() + (pattern.interval * 7));
      break;
    case "monthly":
      next.setMonth(next.getMonth() + pattern.interval);
      break;
    case "yearly":
      next.setFullYear(next.getFullYear() + pattern.interval);
      break;
  }
  
  if (pattern.endDate && next > new Date(pattern.endDate)) {
    return null;
  }
  
  return next;
}

export function generateOccurrences(
  startDate: Date,
  pattern: RecurrencePattern,
  limit: number = 10
): Date[] {
  if (pattern.type !== "pre-generated") {
    return [startDate];
  }

  const occurrences: Date[] = [startDate];
  let currentDate = startDate;
  
  while (occurrences.length < limit) {
    const next = getNextOccurrence(currentDate, pattern);
    if (!next || (pattern.endDate && next > new Date(pattern.endDate))) break;
    occurrences.push(next);
    currentDate = next;
  }
  
  return occurrences;
}

export function shouldGenerateNextOccurrence(
  pattern: RecurrencePattern,
  currentDate: Date
): boolean {
  if (pattern.type !== "on-completion" || pattern.frequency === "none") {
    return false;
  }

  if (pattern.endDate && currentDate > new Date(pattern.endDate)) {
    return false;
  }

  return true;
} 