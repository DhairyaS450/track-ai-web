const { google } = require('googleapis');
const { defaultLogger } = require('./log');
require('dotenv').config();

async function fetchGoogleCalendarData(tokens, calendarIds, minTime, maxTime) {
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

        // Fetch all calendars to ensure they exist
        for (const calendarId of calendarIds) {
            await calendar.calendars.get({ calendarId: calendarId });
        }

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

        // Fetch tasks from Google Tasks
        const tasksResponse = await tasks.tasks.list({
            tasklist: '@default',
        });

        const taskItems = tasksResponse.data.items || [];

        return { events: allEvents, tasks: taskItems };
    } catch (error) {
        console.error('Error fetching Google Calendar events:', error);
        throw error;
    }
}

module.exports = { fetchGoogleEvents: fetchGoogleCalendarData };