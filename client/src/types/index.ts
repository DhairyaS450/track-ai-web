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
  status: 'todo' | 'in-progress' | 'completed';
  subject?: string;
  resources?: string;
  recurrence?: 'daily' | 'weekly' | 'monthly';
  completion: number;
  source?: 'google_calendar' | 'google_tasks' | 'manual';
  taskListId?: string;
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
  progress?: number;
  source?: 'google_calendar' | 'manual';
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
}

export * from './deadlines';
export * from './data';