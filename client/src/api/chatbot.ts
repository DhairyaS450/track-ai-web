/* eslint-disable @typescript-eslint/no-explicit-any */
import api from './Api';
import { getTasks } from './tasks';
import { getEvents } from './events';
import { getStudySessions } from './sessions';
import { getUserProfile } from './settings';
import { SchedulableItem } from '@/types/unified'; // Import SchedulableItem type
import { addEvent } from './events'; // Import addEvent function instead of createEvent

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

// Auto-schedule study session
export async function autoScheduleStudySession(itemData: any, duration: number) {
  try {
    // Gather context data
    const [eventsResponse, sessionsResponse, profileResponse] = await Promise.all([
      getEvents(),
      getStudySessions(),
      getUserProfile()
    ]);

    // Filter and limit the context data
    const contextData = {
      events: filterRecentData(eventsResponse.events, 'startTime').map(filterEventData),
      sessions: filterRecentData(sessionsResponse.sessions, 'scheduledFor').map(filterSessionData),
      userProfile: profileResponse.userProfile,
      timeConstraints: profileResponse.timeConstraints
    };

    console.log("Sending request to auto-schedule API with context:", {
      contextSize: {
        events: contextData.events.length,
        sessions: contextData.sessions.length
      }
    });

    const response = await api.post('/api/study-sessions/autoschedule', {
      itemData,
      userProfile: contextData.userProfile,
      events: contextData.events,
      studySessions: contextData.sessions,
      duration,
      autoSchedule: true
    });
    
    // Now handle the actions returned from the backend
    if (response.data?.actions?.length > 0) {
      console.log(`Processing ${response.data.actions.length} actions received from backend`);
      const createdSessions = await processStudySessionActions(response.data.actions);
      
      // Return both the API response and the created sessions
      return {
        ...response,
        data: {
          ...response.data,
          sessions: createdSessions
        }
      };
    }
    
    return response;
  } catch (error: any) {
    console.error('Error auto-scheduling study session:', error);
    
    // Provide more detailed error information
    const errorMessage = error?.response?.data?.error || error.message;
    const statusCode = error?.response?.status;
    
    // Log detailed error information
    console.error(`Auto-schedule API Error (${statusCode}): ${errorMessage}`);
    
    // Throw a user-friendly error
    throw new Error(`Failed to auto-schedule: ${errorMessage}`);
  }
}

// Process study session actions and create events
export async function processStudySessionActions(actions: ChatbotAction[]): Promise<any[]> {
  const createdSessions = [];
  
  // Process each action to create study sessions
  for (const action of actions) {
    try {
      if (action.type !== 'CREATE_SESSION') {
        console.warn(`Skipping unknown action type: ${action.type}`);
        continue;
      }
      
      // Prepare session data from the action
      const sessionData: any = {
        name: action.data.subject, // Use name instead of title to match Event type
        description: action.data.description,
        startTime: action.data.scheduledFor,
        duration: action.data.duration,
        priority: action.data.priority,
        status: action.data.status,
        category: 'studysession',
        autoScheduled: true,
        parentRequestId: action.data.parentRequestId
      };
      
      // Calculate end time for the session
      const startDateTime = new Date(action.data.scheduledFor);
      
      // Calculate the end time while preserving timezone format
      const endDateTime = new Date(startDateTime.getTime() + action.data.duration * 60000);
      const endTimeIso = endDateTime.toISOString();
      
      // Handle timezone preservation
      const scheduledFor = action.data.scheduledFor;
      if (scheduledFor.includes('+') || scheduledFor.includes('-')) {
        // Extract timezone part like "-04:00" from original time
        const timezonePart = scheduledFor.substring(scheduledFor.length - 6);
        // Replace Z in ISO string with the extracted timezone
        sessionData.endTime = endTimeIso.replace('Z', timezonePart);
      } else {
        sessionData.endTime = endTimeIso;
      }
      
      // Create the event using the events API
      const result = await addEvent({
        ...sessionData,
        isAllDay: false,
        isFlexible: false
      });
      
      // Extract the created session from the result
      const createdSession = result.event;
      
      createdSessions.push(createdSession);
      console.log(`Created study session with ID: ${createdSession.id}`);
    } catch (error) {
      console.error('Error creating study session:', error);
      // Continue with other sessions even if one fails
    }
  }
  
  console.log(`Successfully created ${createdSessions.length} study sessions`);
  return createdSessions;
}