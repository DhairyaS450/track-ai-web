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
}

export interface StudySession {
  id: string;
  subject: string;
  goal: string;
  duration: number;
  technique: string;
  status: 'scheduled' | 'in-progress' | 'completed';
  scheduledFor: string;
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