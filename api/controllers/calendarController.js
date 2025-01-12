const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const admin = require('../config/firebase-admin');
const { defaultLogger } = require('../utils/log');
const CalendarEvent = require('../models/CalendarEvent');
const { fetchGoogleEvents, updateGoogleCalendarEvent, updateGoogleTask } = require('../utils/googleCalendar');

const db = admin.firestore();

// These should be added to .env
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:5173/settings';

const oauth2Client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/tasks"
]

exports.getAuthUrl = async (req, res) => {
  try {
    defaultLogger.info('Generating Google Calendar auth URL');
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent'
    });
    defaultLogger.info(`Successfully generated auth URL, ${ url }`);
    res.json({ url });
  } catch (error) {
    defaultLogger.error('Error generating auth URL:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.connectCalendar = async (req, res) => {
  try {
    const { code } = req.body;
    const { uid } = req.user;

    defaultLogger.info(`Request headers: ${req.headers}`);
    defaultLogger.info(`Connect calendar request with code: ${code}`);
    defaultLogger.info(`Attempting to connect calendar for user ${uid}`);

    if (!code) {
      defaultLogger.error('No authorization code provided');
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    defaultLogger.info('Getting tokens from Google');
    const { tokens } = await oauth2Client.getToken(code);
    defaultLogger.info('Received tokens from Google');

    defaultLogger.info('Storing tokens in Firestore');
    await db.collection('users').doc(uid).update({
      googleCalendar: {
        tokens,
        connected: true,
        lastSync: new Date().toISOString()
      }
    });

    defaultLogger.info(`Google Calendar connected successfully for user ${uid}`);
    res.json({ success: true, message: 'Calendar connected successfully' });
  } catch (error) {
    defaultLogger.error(`Error connecting calendar: ${error.message}\n${error.stack}`);
    res.status(500).json({ error: error.message });
  }
};

exports.getConnectionStatus = async (req, res) => {
  try {
    const { uid } = req.user;
    defaultLogger.info(`Checking calendar connection status for user ${uid}`);

    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();

    const connected = userData?.googleCalendar?.connected;
    defaultLogger.info(`Calendar connection status for user ${uid}: ${connected}`);

    res.json({ connected });
  } catch (error) {
    defaultLogger.error('Error checking calendar connection status:', error.stack);
    res.status(500).json({ error: error.message });
  }
};

exports.getGoogleCalendars = async (req, res) => {
  try {
    const { uid } = req.user;
    defaultLogger.info(`Fetching Google Calendars for user ${uid}`);

    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();

    if (!userData?.googleCalendar?.tokens) {
      defaultLogger.warn(`Google Calendar not connected for user ${uid}`);
      return res.status(400).json({ error: 'Google Calendar not connected' });
    }

    const oauth2Client = new OAuth2Client(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      REDIRECT_URI
    );
    oauth2Client.setCredentials(userData.googleCalendar.tokens);

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const calendars = await calendar.calendarList.list();

    defaultLogger.info(`Successfully fetched ${calendars.data.items.length} calendars for user ${uid}`);
    res.json({ calendars: calendars.data.items });
  } catch (error) {
    defaultLogger.error('Error fetching Google Calendars:', error.stack);
    res.status(500).json({ error: error.message });
  }
}

exports.getGoogleTasks = async (req, res) => { 
  try {
    const { uid } = req.user;
    defaultLogger.info(`Fetching Google Tasks for user ${uid}`);

    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();

    if (!userData?.googleCalendar?.tokens) {
      defaultLogger.warn(`Google Calendar not connected for user ${uid}`);
      return res.status(400).json({ error: 'Google Calendar not connected' });
    }

    const oauth2Client = new OAuth2Client(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      REDIRECT_URI
    );
    oauth2Client.setCredentials(userData.googleCalendar.tokens);

    const tasks = google.tasks({ version: 'v1', auth: oauth2Client });
    const taskLists = await tasks.tasklists.list();

    defaultLogger.info(`Successfully fetched ${taskLists.data.items.length} task lists for user ${uid}`);
    res.json({ taskLists: taskLists.data.items });
  } catch (error) {
    defaultLogger.error('Error fetching Google Tasks:', error.stack);
    res.status(500).json({ error: error.message });
  }
}

exports.syncGoogleEvents = async (req, res) => {
  try {
    const { uid } = req.user;
    const { calendarIds, taskListIds } = req.body;
    defaultLogger.info(`Syncing Google Calendar events for user ${uid}`);

    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();

    if (!userData?.googleCalendar?.tokens) {
      defaultLogger.warn(`Google Calendar not connected for user ${uid}`);
      return res.status(400).json({ error: 'Google Calendar not connected' });
    }

    // Fetch events from last month to next year
    const timeMin = new Date();
    timeMin.setMonth(timeMin.getMonth() - 1);
    const timeMax = new Date();
    timeMax.setFullYear(timeMax.getFullYear() + 1);

    defaultLogger.info(`Fetching Google Calendar events for user ${uid} from ${timeMin} to ${timeMax}`);
    const events = await fetchGoogleEvents(
      userData.googleCalendar.tokens,
      calendarIds,
      taskListIds,
      timeMin,
      timeMax
    );

    // Store events in Firestore
    defaultLogger.info(`Storing ${events.events.length} events in Firestore for user ${uid}`);
    for (const event of events.events) {
      try {
        await CalendarEvent.create(uid, event);
      } catch (error) {
        defaultLogger.error(`Error storing event ${event.id} for user ${uid}: ${error}`);
        // Continue with other events even if one fails
      }
    }
    defaultLogger.info(`Successfully synced ${events.events.length} events for user ${uid}`);

    // Store tasks in Firestore
    defaultLogger.info(`Storing ${events.tasks.length} tasks in Firestore for user ${uid}`);
    for (const task of events.tasks) {
      try {
        await CalendarEvent.createTask(uid, task);
      } catch (error) {
        defaultLogger.error(`Error storing task ${task.id} for user ${uid}: ${error}`);
        // Continue with other tasks even if one fails
      }
    }

    defaultLogger.info(`Successfully synced ${events.tasks.length} tasks for user ${uid}`);
    res.json({
      success: true,
      message: `Successfully synced ${events.events.length} events and ${events.tasks.length} tasks`,
      events
    });
  } catch (error) {
    defaultLogger.error(`Error syncing calendar items: ${error.message}\n${error.stack}`);
    res.status(500).json({ error: error.message });
  }
};

exports.getEvents = async (req, res) => { 
  try {
    const userId = req.user.uid;
    defaultLogger.info(`Fetching calendar events for user ${userId}`);
    
    const events = await CalendarEvent.getByUserId(userId);
    
    defaultLogger.info(`Retrieved ${events.length} events for user ${userId}`);
    res.json({ events });
  } catch (error) {
    defaultLogger.error('Error fetching calendar events:', error.stack);
    res.status(500).json({ error: error.message });
  }
}

exports.updateGoogleEvent = async (req, res) => {
  try {
    const { uid } = req.user;
    const { calendarId, eventId } = req.params;
    const updates = req.body;

    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();
    if (!userData?.googleCalendar?.tokens) {
      defaultLogger.warn(`Google Calendar not connected for user ${uid}`);
      return res.status(400).json({ error: 'Google Calendar not connected' });
    }

    defaultLogger.info(`Updating event ${eventId} for user ${uid}`);
    await updateGoogleCalendarEvent(
      userData.googleCalendar.tokens,
      calendarId,
      eventId,
      updates
    )

    defaultLogger.info(`Successfully updated event ${eventId} for user ${uid}`);
    res.json({ success: true, message: 'Event updated successfully' });
  } catch (error) {
    defaultLogger.error(`Error updating event: ${error.message}\n${error.stack}`);
    res.status(500).json({ error: error.message });
  }
};

exports.updateGoogleTask = async (req, res) => {
  try {
    const { uid } = req.user;
    const { taskListId, taskId } = req.params;
    const updates = req.body;

    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();
    if (!userData?.googleCalendar?.tokens) {
      defaultLogger.warn(`Google Calendar not connected for user ${uid}`);
      return res.status(400).json({ error: 'Google Calendar not connected' });
    }

    defaultLogger.info(`Updating task ${taskId} for user ${uid}`);
    await updateGoogleTask(
      userData.googleCalendar.tokens,
      taskListId,
      taskId,
      updates
    )

    defaultLogger.info(`Successfully updated task ${taskId} for user ${uid}`);
    res.json({ success: true, message: 'Task updated successfully' });
  } catch (error) { 
    defaultLogger.error(`Error updating task: ${error.message}\n${error.stack}`);
    res.status(500).json({ error: error.message });
  }
}