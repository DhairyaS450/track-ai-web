/* eslint-disable @typescript-eslint/no-explicit-any */
import api from './Api';
import { auth } from '../config/firebase';
// Connect Google Calendar
// POST /api/calendar/connect
// Request: { code: string, uid: string }
// Response: { success: boolean, message: string }
export const connectGoogleCalendar = async (code: string) => {
  console.log('Starting Google Calendar connection with code length:', code.length);
  console.log('Authorization header:', api.defaults.headers.common['Authorization']);
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User not authenticated");
    }
    
    console.log('Connecting Google Calendar with code:', code);
    const response = await api.post('/api/calendar/connect', { 
      code,
      uid: currentUser.uid
    });
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
export const syncWithGoogle = async (calendarIds: Array<string>, taskListIds: Array<string>) => {
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

// Update Calendar Event
// PATCH /api/calendar/events/:calendarId/:eventId
// Request: { updates: any }
// Response: { success: boolean, message: string }
export const updateCalendarEvent = async (calendarId: string, eventId: string, updates: any) => {
  try {
    console.log('Updating calendar event:', event);
    const response = await api.patch(`/api/calendar/events/${calendarId}/${eventId}`, { updates });
    console.log('Successfully updated calendar event');
    return response.data;
  } catch (error: any) {
    console.error('Error updating calendar event:', error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Delete Calendar Event
// DELETE /api/calendar/events/:calendarId/:eventId
// Response: { success: boolean, message: string }
export const deleteCalendarEvent = async (calendarId: string, eventId: string) => {
  try {
    console.log('Deleting calendar event:', eventId);
    const response = await api.delete(`/api/calendar/events/${calendarId}/${eventId}`);
    console.log('Successfully deleted calendar event');
    return response.data;
  } catch (error: any) {
    console.error('Error deleting calendar event:', error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Update Google Tasks Task
// PATCH /api/calendar/tasks/:taskListId/:taskId
// Request: { updates: any }
// Response: { success: boolean, message: string }
export const updateGoogleTasksTask = async (taskListId: string, taskId: string, updates: any) => {
  try {
    console.log('Updating Google Tasks task:', taskId);
    const response = await api.patch(`/api/calendar/tasks/${taskListId}/${taskId}`, { updates });
    console.log('Successfully updated Google Tasks task');
    return response.data;
  } catch (error: any) {
    console.error('Error updating Google Tasks task:', error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Delete Google Tasks Task
// DELETE /api/calendar/tasks/:taskListId/:taskId
// Response: { success: boolean, message: string }
export const deleteGoogleTasksTask = async (taskListId: string, taskId: string) => {
  try {
    console.log('Deleting Google Tasks task:', taskId);
    const response = await api.delete(`/api/calendar/tasks/${taskListId}/${taskId}`);
    console.log('Successfully deleted Google Tasks task');
    return response.data;
  } catch (error: any) {
    console.error('Error deleting Google Tasks task:', error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};