import api from './Api';

// Connect Google Calendar
// POST /api/calendar/connect
// Request: { code: string }
// Response: { success: boolean, message: string }
export const connectGoogleCalendar = async (code: string) => {
  console.log('Starting Google Calendar connection with code length:', code.length);
  console.log('Authorization header:', api.defaults.headers.common['Authorization']);
  try {
    console.log('Connecting Google Calendar with code:', code);
    const response = await api.post('/api/calendar/connect', { code });
    console.log('Successfully connected Google Calendar');
    return response.data;
  } catch (error: any) {
    console.error('Error connecting Google Calendar:', error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Check Google Calendar Connection Status
// GET /api/calendar/status
// Response: { connected: boolean }
export const getGoogleCalendarStatus = async () => {
  try {
    console.log('Checking Google Calendar connection status');
    const response = await api.get('/api/calendar/status');
    console.log('Calendar connection status:', response.data.connected);
    return response.data;
  } catch (error: any) {
    console.error('Error checking Google Calendar status:', error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Sync Google Calendar Events
// POST /api/calendar/sync  
// Response: { success: boolean, message: string, events: Array<CalendarEvent> }
export const syncWithGoogle = async (calendarIds: Array<String>, taskListIds: Array<String>) => {
  try {
    console.log('Starting Google Calendar sync');
    const response = await api.post('/api/calendar/sync', { calendarIds, taskListIds });
    console.log('Successfully synced Google Calendar events');
    return response.data;
  } catch (error: any) {
    console.error('Error syncing Google Calendar:', error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Get Google Calendars
// GET /api/calendar/google-calendars
// Response: { calendars: Array<Calendar> }
export const getGoogleCalendars = async () => {
  try {
    console.log('Fetching Google Calendars');
    const response = await api.get('/api/calendar/google-calendars');
    console.log('Successfully fetched Google Calendars');
    return response.data;
  } catch (error: any) {
    console.error('Error fetching Google Calendars:', error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Get Google Task Lists
// GET /api/calendar/google-task-lists
// Response: { taskLists: Array<TaskList> }
export const getGoogleTaskLists = async () => {
  try {
    console.log('Fetching Google Task Lists');
    const response = await api.get('/api/calendar/google-task-lists');
    console.log('Successfully fetched Google Task Lists');
    return response.data;
  } catch (error: any) {
    console.error('Error fetching Google Task Lists:', error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Get Calendar Events
// GET /api/calendar/events
// Response: { events: Array<CalendarEvent> }
export const getCalendarEvents = async () => {
  try {
    console.log('Fetching calendar events');
    const response = await api.get('/api/calendar/events');
    console.log('Successfully fetched calendar events');
    return response.data;
  } catch (error: any) {
    console.error('Error fetching calendar events:', error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};