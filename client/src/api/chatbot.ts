/* eslint-disable @typescript-eslint/no-explicit-any */
import api from './Api';
import { getTasks } from './tasks';
import { getEvents } from './events';
import { getStudySessions } from './sessions';
import { subMonths } from 'date-fns';

interface FilteredTask {
  title: string;
  description: string;
  deadline: string;
  priority: string;
  status: string;
  recurrence: string;
  timeSlots: Array<{ startDate: string; endDate: string }>;
  completion: number;
}

interface FilteredEvent {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  isFlexible: boolean;
  priority: string;
  recurrence: string;
}

interface FilteredSession {
  subject: string;
  description: string;
  scheduledFor: string;
  duration: number;
  status: string;
  completion: number;
  priority: string;
}

const filterRecentData = <T>(
  data: T[],
  dateField: keyof T
): T[] => {
  const oneMonthAgo = subMonths(new Date(), 1);
  return data.filter(item => {
    const itemDate = new Date(item[dateField] as string);
    return itemDate >= oneMonthAgo;
  });
};

const filterTaskData = (task: any): FilteredTask => ({
  title: task.title,
  description: task.description,
  deadline: task.deadline,
  priority: task.priority,
  status: task.status,
  recurrence: task.recurrence,
  timeSlots: task.timeSlots,
  completion: task.completion
});

const filterEventData = (event: any): FilteredEvent => ({
  title: event.title,
  description: event.description,
  startTime: event.startTime,
  endTime: event.endTime,
  isAllDay: event.isAllDay,
  isFlexible: event.isFlexible,
  priority: event.priority,
  recurrence: event.recurrence
});

const filterSessionData = (session: any): FilteredSession => ({
  subject: session.subject,
  description: session.description,
  scheduledFor: session.scheduledFor,
  duration: session.duration,
  status: session.status,
  completion: session.completion,
  priority: session.priority
});

export const processChatMessage = async (message: string, chatHistory: { type: 'user' | 'bot', content: string }[]) => {
  try {
    // Gather context data
    const [tasksResponse, eventsResponse, sessionsResponse] = await Promise.all([
      getTasks(),
      getEvents(),
      getStudySessions()
    ]);

    // Filter and limit the context data
    const context = {
      tasks: filterRecentData(tasksResponse.tasks, 'deadline').map(filterTaskData),
      events: filterRecentData(eventsResponse.events, 'startTime').map(filterEventData),
      sessions: filterRecentData(sessionsResponse.sessions, 'scheduledFor').map(filterSessionData),
      chatHistory: chatHistory.slice(-10) // Only keep last 10 messages for context
    };

    const response = await api.post('/api/chatbot', { 
      message,
      context
    });

    return response.data;
  } catch (error: any) {
    console.error('Error processing chat message:', error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};