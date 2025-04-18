/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { RecurrencePattern } from "./recurrence";

// Status types that apply across all items
export type ItemStatus = 'scheduled' | 'todo' | 'in-progress' | 'completed' | 'cancelled' | 'pending';
export type ItemPriority = 'High' | 'Medium' | 'Low';
export type ItemType = 'task' | 'event' | 'session';

// Base interface for all schedulable items
export interface SchedulableItem {
  id?: string;  // Make id optional since Firestore will generate it
  title: string;
  description: string;
  startTime: string;      // ISO time string
  endTime?: string;       // Optional for tasks
  priority: ItemPriority;
  status: ItemStatus;
  itemType: ItemType;
  userId: string;         // For data ownership
  createdAt: string;
  updatedAt?: string;
  recurrence?: RecurrencePattern;
  source?: 'google_calendar' | 'google_tasks' | 'manual';
}

// Specific item types extend the base interface
export interface UnifiedTask extends SchedulableItem {
  itemType: 'task';
  deadline: string;       // Due date for the task (replaces separate deadline objects)
  completion: number;     // Progress percentage
  timeSlots?: {           // Optional scheduled work periods
    startDate: string;
    endDate: string;
  }[];
  subject?: string;
  resources?: string;
  category?: string;      // Adding category from deadlines
  status: 'todo' | 'in-progress' | 'completed'; // Specific task statuses
}

export interface UnifiedEvent extends SchedulableItem {
  itemType: 'event';
  isAllDay: boolean;
  isFlexible: boolean;
  location?: string;
  category?: string;
  associatedTaskIds?: string[];
  calendarId?: string;    // For external calendar integration
}

export interface UnifiedStudySession extends SchedulableItem {
  itemType: 'session';
  subject: string;
  goal: string;
  duration: number;       // In minutes
  technique: string;      // e.g., 'pomodoro', 'deepwork'
  scheduledFor: string;   // For compatibility
  isFlexible?: boolean;
  breakInterval?: number;
  breakDuration?: number;
  materials?: string;
  notes: string;
  currentPhase?: 'study' | 'break';
  progress?: number;
  type: "studySession";
  sessionMode?: 'basic' | 'sections';
  autoSchedule?: boolean; // Whether this session should be auto-scheduled
  autoScheduled?: boolean; // Whether this session was auto-scheduled by AI
  parentRequestId?: string; // ID of the parent auto-schedule request
  sections?: Array<{
    id?: string;
    subject: string;
    duration: number;
    breakDuration: number;
    notes?: string;
    materials?: string;
    completion?: number;
    status?: 'pending' | 'in-progress' | 'completed';
  }>;
}

// Helper functions to convert between unified and legacy models
export function convertToUnified(item: any, itemType: ItemType): SchedulableItem {
  // Implementation will depend on your existing data structure
  const base: SchedulableItem = {
    id: item.id,
    title: item.title || item.name || item.subject || '',
    description: item.description || item.goal || '',
    startTime: item.startTime || item.scheduledFor || item.deadline || item.dueDate,
    endTime: item.endTime,
    priority: item.priority || 'Medium',
    status: item.status || 'scheduled',
    itemType,
    userId: item.userId,
    createdAt: item.createdAt || new Date().toISOString(),
    recurrence: item.recurrence,
    source: item.source || 'manual',
  };

  // Add specific fields based on itemType
  switch (itemType) {
    case 'task':
      return { ...base, ...item, itemType } as UnifiedTask;
    case 'event':
      return { ...base, ...item, itemType } as UnifiedEvent;
    case 'session':
      return { ...base, ...item, itemType } as UnifiedStudySession;
    default:
      return base;
  }
}

// Convert back to legacy format for existing APIs
export function convertFromUnified(unifiedItem: SchedulableItem): any {
  // First, create a clean object with no undefined values
  const cleanedItem = Object.fromEntries(
    Object.entries(unifiedItem).filter(([_, v]) => v !== undefined)
  );
  
  // Extract the item type
  const { itemType } = cleanedItem;
  
  // Type-specific conversions
  switch (itemType) {
    case 'task': {
      const task = cleanedItem as UnifiedTask;
      // For tasks, explicitly exclude fields that cause problems
      const {
        endTime,
        startTime,
        itemType: _,
        userId: __,
        ...taskFields
      } = task;
      
      return {
        ...taskFields,
        deadline: task.deadline || new Date().toISOString(),
        timeSlots: task.timeSlots || [],
        completion: task.completion || 0,
        subject: task.subject || "",
        resources: task.resources || "",
        status: task.status || "todo",
      }; 
    }
      
    case 'event': {
      const event = cleanedItem as UnifiedEvent;
      const { 
        itemType: _, 
        userId: __, 
        ...eventFields 
      } = event;
      
      return {
        ...eventFields,
        name: event.title, // Convert title to name for events
        startTime: event.startTime,
        endTime: event.endTime || event.startTime, // Ensure endTime is never undefined
        isAllDay: event.isAllDay || false,
        isFlexible: event.isFlexible || false,
        location: event.location || "",
        category: event.category || "",
        associatedTaskIds: event.associatedTaskIds || [],
      }; 
    }
      
    case 'session': {
      const session = cleanedItem as UnifiedStudySession;
      const { 
        itemType: _, 
        userId: __, 
        endTime: ___, 
        ...sessionFields 
      } = session;
      
      return {
        ...sessionFields,
        subject: session.subject || "",
        goal: session.goal || "",
        duration: session.duration || 30,
        technique: session.technique || "pomodoro",
        scheduledFor: session.scheduledFor || session.startTime,
        status: session.status || "scheduled",
        materials: session.materials || "",
        notes: session.notes || "",
        breakInterval: session.breakInterval || 25,
        breakDuration: session.breakDuration || 5,
        completion: session.progress || 0,
      }; 
    }
      
    default:
      // Remove problematic fields and return
      { const { 
        itemType: _, 
        userId: __, 
        endTime: ___, 
        ...defaultFields 
      } = cleanedItem;
      return defaultFields; }
  }
} 