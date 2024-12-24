import api from './api';

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