export interface TimeSlot {
  startDate: string;
  endDate: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  deadline: string;
  timeSlots: TimeSlot[];
  status: 'todo' | 'in-progress' | 'completed' | 'archived';
  subject?: string;
  resources?: string;
  recurrence?: 'daily' | 'weekly' | 'monthly';
  completion: number;
  source?: 'google_calendar' | 'google_tasks' | 'manual';
  taskListId?: string;
  calendarId?: string;
  googleEventId?: string;
  isAllDayTask?: boolean;
}

export interface StudySession {
  id: string;
  subject: string;
  goal: string;
  duration: number;
  technique: string;
  status: 'scheduled' | 'in-progress' | 'completed';
  scheduledFor: string;
  isFlexible?: boolean;
  breakInterval?: number;
  breakDuration?: number;
  materials?: string;
  priority?: 'High' | 'Medium' | 'Low';
  reminders?: Array<{
    type: 'minutes' | 'hours' | 'days';
    amount: number;
  }>;
  linkedTaskIds?: string[];
  linkedEventIds?: string[];
  isAIRecommended?: boolean;
  aiReason?: string;
  startTime?: string;
  endTime?: string;
  completion: number;
  notes: string;
  currentPhase?: 'study' | 'break';
  pausedAt?: number;
  resumedAt?: number;
  totalPausedTime?: number;
  sessionMode?: 'sections' | 'basic';
  progress?: number;
  source?: 'google_calendar' | 'manual' | 'auto-scheduler';
  sections?: StudySessionSection[];
  currentSectionIndex?: number;
  autoSchedule?: boolean;
  autoScheduled?: boolean;
  parentRequestId?: string;
}

export interface StudySessionSection {
  id: string;
  subject: string;
  duration: number;
  breakDuration: number;
  notes?: string;
  completion: number;
  status: 'pending' | 'in-progress' | 'completed';
  materials?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface MoodEntry {
  id: string;
  rating: number;
  timestamp: string;
  sessionId?: string;
}

export interface Event {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  isFlexible: boolean;
  location?: string;
  description?: string;
  category?: string;
  reminders?: {
    type: 'days' | 'hours' | 'minutes';
    amount: number;
  }[];
  priority?: 'High' | 'Medium' | 'Low';
  recurrence?: 'daily' | 'weekly' | 'monthly';
  associatedTaskIds?: string[];
  source?: 'google_calendar' | 'manual';
  calendarId?: string;
  googleEventId?: string;
}

export interface TimeConstraint {
  id: string;
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  daysOfWeek: number[]; // 0-6 for Sunday-Saturday
  startTime: string;    // HH:mm format
  endTime: string;      // HH:mm format
  isRecurring: boolean; // if false, it's a one-time constraint
  startDate?: string;   // ISO date string, for non-recurring constraints
  endDate?: string;     // ISO date string, for non-recurring constraints
}

export * from './deadlines';
export * from './data';