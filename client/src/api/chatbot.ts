/* eslint-disable @typescript-eslint/no-explicit-any */
import api from './Api';
import { getTasks } from './tasks';
import { getEvents } from './events';
import { getStudySessions } from './sessions';
import { getUserProfile } from './settings';

interface FilteredTask {
  id: string;
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
  id: string;
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
  id: string;
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  
  return data.filter(item => {
    const itemDate = new Date(item[dateField] as string);
    return itemDate >= today && itemDate <= thirtyDaysFromNow;
  });
};

const filterTaskData = (task: any): FilteredTask => ({
  id: task.id,
  title: task.title?.substring(0, 50),
  description: task.description?.substring(0, 100),
  deadline: task.deadline,
  priority: task.priority,
  status: task.status,
  recurrence: task.recurrence,
  timeSlots: task.timeSlots,
  completion: task.completion
});

const filterEventData = (event: any): FilteredEvent => ({
  id: event.id,
  title: event.title?.substring(0, 50),
  description: event.description?.substring(0, 100),
  startTime: event.startTime,
  endTime: event.endTime,
  isAllDay: event.isAllDay,
  isFlexible: event.isFlexible,
  priority: event.priority,
  recurrence: event.recurrence
});

const filterSessionData = (session: any): FilteredSession => ({
  id: session.id,
  subject: session.subject?.substring(0, 50),
  description: session.description?.substring(0, 100),
  scheduledFor: session.scheduledFor,
  duration: session.duration,
  status: session.status,
  completion: session.completion,
  priority: session.priority
});

export const processChatMessage = async (message: string, chatHistory: { type: 'user' | 'bot', content: string }[]) => {
  try {
    // Gather context data

    const [tasksResponse, eventsResponse, sessionsResponse, profileResponse] = await Promise.all([
      getTasks(),
      getEvents(),
      getStudySessions(),
      getUserProfile()
    ]);

    // Filter and limit the context data
    const context = {
      tasks: filterRecentData(tasksResponse.tasks, 'deadline').map(filterTaskData),
      events: filterRecentData(eventsResponse.events, 'startTime').map(filterEventData),
      sessions: filterRecentData(sessionsResponse.sessions, 'scheduledFor').map(filterSessionData),
      profile: profileResponse.userProfile,
      timeConstraints: profileResponse.timeConstraints,
      chatHistory: chatHistory.slice(-5) // Only keep last 5 messages for context
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