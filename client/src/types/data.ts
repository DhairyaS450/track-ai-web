import { Reminder } from "./deadlines";
import { Event, StudySession, Task } from ".";

export interface DataContextType {
    tasks: Task[];
    events: Event[];
    sessions: StudySession[];
    reminders: Reminder[];
    loading: boolean;
    error: string | null;
  
    addTask: (task: Omit<Task, 'id' | 'userId' | 'createdAt'>) => Promise<{ task: Task }>;
    updateTask: (id: string, updates: Partial<Task>) => Promise<{ task: Task }>;
    deleteTask: (id: string) => Promise<{ success: boolean }>;
    markTaskComplete: (id: string) => Promise<{ success: boolean }>;
  
    addEvent: (event: Omit<Event, 'id' | 'userId' | 'createdAt'>) => Promise<{ event: Event }>;
    updateEvent: (id: string, updates: Partial<Event>) => Promise<{ event: Event }>;
    deleteEvent: (id: string) => Promise<{ success: boolean }>;
  
    addSession: (session: Omit<StudySession, 'id' | 'userId' | 'createdAt'>) => Promise<{ session: StudySession }>;
    updateSession: (id: string, updates: Partial<StudySession>) => Promise<{ session: StudySession }>;
    deleteSession: (id: string) => Promise<{ success: boolean }>;
    startSession: (id: string) => Promise<{ session: StudySession }>;
    endSession: (id: string, notes?: string) => Promise<{ session: StudySession }>;
    updateSessionSection: (id: string, sectionIndex: number) => Promise<{ success: boolean }>;
  
    addReminder: (reminder: Omit<Reminder, 'id' | 'userId' | 'createdAt'>) => Promise<{ reminder: Reminder }>;
    updateReminder: (id: string, updates: Partial<Reminder>) => Promise<{ reminder: Reminder }>;
    deleteReminder: (id: string) => Promise<{ success: boolean }>;
    dismissReminder: (id: string) => Promise<{ success: boolean }>;
  }