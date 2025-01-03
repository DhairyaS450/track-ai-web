const { google } = require('googleapis');
const { defaultLogger } = require('./log');
require('dotenv').config();

/**
 * Fetches Google Calendar events from the given calendar IDs within the given time range.
 * @param {Object} tokens - The Google OAuth2 tokens.
 * @param {string[]} calendarIds - The IDs of the Google Calendars to fetch events from.
 * @param {string[]} taskListIds - The IDs of the Google Tasks to fetch events from.
 * @param {string} minTime - The minimum time of the events to fetch.
 * @param {string} maxTime - The maximum time of the events to fetch.
 * @returns {Promise<Object>} - The fetched events and tasks.
 */
async function fetchGoogleCalendarData(tokens, calendarIds, taskListIds, minTime, maxTime) {
    defaultLogger.info(`Fetching Google Calendar events from ${minTime} to ${maxTime}`);
    defaultLogger.info(`Tokens: ${JSON.stringify(tokens)}`);
    const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    const REDIRECT_URI = 'http://localhost:5173/settings';
    
    const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
    auth.setCredentials(tokens);

    const calendar = google.calendar({ version: 'v3', auth });
    const tasks = google.tasks({ version: 'v1', auth });

    try {
        const allEvents = [];
        const taskItems = [];

        // Fetch events from each calendar
        for (const calendarId of calendarIds) {
            const eventsResponse = await calendar.events.list({
                calendarId: calendarId,
                timeMin: minTime,
                timeMax: maxTime,
                singleEvents: true,
                orderBy: 'startTime',
            });

            allEvents.push(...eventsResponse.data.items);
        }

        // Fetch tasks from each task list
        for (const taskListId of taskListIds) {
            const tasksResponse = await tasks.tasks.list({
                tasklist: taskListId,
            });

            taskItems.push(...tasksResponse.data.items);
        }

        return { events: allEvents, tasks: taskItems };
    } catch (error) {
        console.error('Error fetching Google Calendar events:', error);
        throw error;
    }
}

/**
 * Updates a Google Calendar event with the given updates.
 * @param {Map<String, String>} tokens 
 * @param {String} calendarId 
 * @param {String} eventId 
 * @param {Map<String, any>} updates 
 * @returns {Promise<Object>} - The updated event.
 */
async function updateGoogleCalendarEvent(tokens, calendarId, eventId, updates) {
    const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    const REDIRECT_URI = 'http://localhost:5173/settings';
    
    const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
    auth.setCredentials(tokens);

    const calendar = google.calendar({ version: 'v3', auth });

    try {
        const response = await calendar.events.patch({
            calendarId: calendarId,
            eventId: eventId,
            requestBody: updates,
        });

        return response.data;
    } catch (error) {
        console.error('Error updating Google Calendar event:', error);
        throw error;
    }
}

module.exports = { fetchGoogleEvents: fetchGoogleCalendarData, updateGoogleEvent: updateGoogleCalendarEvent };