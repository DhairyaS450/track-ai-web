/* eslint-disable @typescript-eslint/no-explicit-any */
import api from './Api';
import { getTasks } from './tasks';
import { getEvents } from './events';
import { getStudySessions } from './sessions';
import { getUserProfile } from './settings';
import { SchedulableItem } from '@/types/unified'; // Import SchedulableItem type

// Define action interface
export interface ChatbotAction {
  type: string;
  data: any;
}

// Define response interface for regular chat
interface ChatbotApiResponse {
  response: {
    response?: string;
    actions?: ChatbotAction[];
  };
}

// Define response interface for conflict suggestion
export interface ConflictSuggestionResponse {
  suggestion: string;
  action: ChatbotAction | null;
  error?: string; // Include optional error message from backend
}

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

// Validate response data for regular chat
const validateChatResponse = (responseData: any): ChatbotApiResponse => {
  // If the response is not in expected format, transform it to match the expected structure
  if (!responseData) {
    throw new Error('Empty response received from server');
  }
  
  if (typeof responseData !== 'object') {
    return {
      response: {
        response: String(responseData),
        actions: []
      }
    };
  }
  
  // If response is not nested properly, fix the structure
  if (typeof responseData.response === 'string') {
    return {
      response: {
        response: responseData.response,
        actions: Array.isArray(responseData.actions) ? responseData.actions : []
      }
    };
  }
  
  // If the structure seems correct, return as is
  return responseData;
};

// Regular chat message processing (keep existing)
export const processChatMessage = async (message: string, chatHistory: { type: 'user' | 'bot', content: string }[]): Promise<ChatbotApiResponse> => {
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

    console.log("Sending request to chatbot API with context:", {
      message,
      contextSize: {
        tasks: context.tasks.length,
        events: context.events.length,
        sessions: context.sessions.length,
        chatHistory: context.chatHistory.length
      }
    });

    const response = await api.post('/api/chatbot', { 
      message,
      context
    });

    console.log("API response from server:", response.data);
    
    // Validate and normalize the response
    const validatedResponse = validateChatResponse(response.data);
    console.log("Validated response:", validatedResponse);
    
    return validatedResponse;
  } catch (error: any) {
    console.error('Error processing chat message:', error);
    
    // Provide more detailed error information
    const errorMessage = error?.response?.data?.error || error.message;
    const statusCode = error?.response?.status;
    
    // Log detailed error information
    console.error(`Chat API Error (${statusCode}): ${errorMessage}`);
    
    // Throw a user-friendly error
    throw new Error(`Failed to process your message: ${errorMessage}`);
  }
};

// *** NEW FUNCTION for conflict resolution suggestion ***
export const getConflictSuggestion = async (
  item1: SchedulableItem,
  item2: SchedulableItem
): Promise<ConflictSuggestionResponse> => {
  try {
    // We might pass minimal context or let the backend fetch if needed based on user
    // For now, sending just the items.
    const response = await api.post('/api/chatbot/suggest-resolution', {
      item1,
      item2,
      // context: {} // Optionally add profile/constraints if readily available
    });

    console.log("Conflict suggestion API response:", response.data);

    // Basic validation for the expected structure
    if (response.data && typeof response.data.suggestion === 'string') {
      return response.data as ConflictSuggestionResponse;
    } else {
      console.error("Invalid conflict suggestion response structure:", response.data);
      return {
        suggestion: "Received an unexpected response format from the server.",
        action: null,
      };
    }
  } catch (error: any) {
    console.error('Error getting conflict suggestion:', error);
    const errorMessage = error?.response?.data?.suggestion || // Check if backend sent suggestion in error
                         error?.response?.data?.error || 
                         error.message || 
                         "Failed to connect to the suggestion service.";
    return {
      suggestion: `Error: ${errorMessage}`,
      action: null,
      error: errorMessage // Pass the error message back
    };
  }
};