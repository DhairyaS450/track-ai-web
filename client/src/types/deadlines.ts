export type DeadlinePriority = 'Low' | 'Medium' | 'High';
export type DeadlineStatus = 'Pending' | 'Completed';

export interface Deadline {
  id: string;
  title: string;
  dueDate: string; // ISO timestamp
  priority: DeadlinePriority;
  category: string;
  associatedTaskId?: string;
  notificationTimes?: string[]; // Array of ISO timestamps
  status: DeadlineStatus;
  createdAt: string;
  updatedAt: string;
}

export type ReminderFrequency = 'Once' | 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
export type ReminderStatus = 'Active' | 'Dismissed';

export interface ReminderRecurrence {
  frequency: ReminderFrequency;
  interval: number;
  endDate?: string; // ISO timestamp
}

export interface Reminder {
  id: string;
  title: string;
  reminderTime: string; // ISO timestamp
  recurring?: ReminderRecurrence;
  notificationMessage?: string;
  linkedToCalendarEvent?: boolean;
  status: ReminderStatus;
  type: 'Quick Reminder';
  createdAt: string;
  updatedAt: string;
}
