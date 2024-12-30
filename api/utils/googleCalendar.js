const { google } = require('googleapis');
const { defaultLogger } = require('./log');
require('dotenv').config();

async function fetchGoogleEvents(tokens, minTime, maxTime) {
    defaultLogger.info(`Fetching Google Calendar events from ${minTime} to ${maxTime}`);
    defaultLogger.info(`Tokens: ${JSON.stringify(tokens)}`);
    const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    const REDIRECT_URI = 'http://localhost:5173/settings';
    
    const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
    auth.setCredentials(tokens);

    const calendar = google.calendar({ version: 'v3', auth });

    try {
        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: minTime,
            timeMax: maxTime,
            singleEvents: true,
            orderBy: 'startTime',
        });

        return response.data.items;
    } catch (error) {
        console.error('Error fetching Google Calendar events:', error);
        throw error;
    }
}

module.exports = { fetchGoogleEvents };