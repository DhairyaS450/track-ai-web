const { google } = require("googleapis");
const { defaultLogger } = require("./log");
require("dotenv").config();

/**
 * Convert UTC datetime to ISO 8601 format
 * @param {string} dateTime 
 * @param {string} timeZone 
 * @returns {string} The formatted string
 */
function convertUTCToTimeZone(utcDateTime, offset) {
  // Parse the UTC date-time string
  const utcDate = new Date(utcDateTime);

  // Convert offset from "-05:00" format to minutes
  const [hours, minutes] = offset.split(':').map(Number);
  const totalOffsetMinutes = hours * 60 + Math.sign(hours) * minutes;

  // Adjust the time by the offset
  const localDate = new Date(utcDate.getTime() + totalOffsetMinutes * 60 * 1000);

  // Format the local date in ISO 8601 format
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  const hour = String(localDate.getHours()).padStart(2, '0');
  const minute = String(localDate.getMinutes()).padStart(2, '0');
  const second = String(localDate.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}T${hour}:${minute}:${second}${offset}`;
}

function getOffset(date, timeZone) {
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone }));
  const diff = tzDate - utcDate;

  const hours = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0');
  const minutes = String((Math.abs(diff) / (1000 * 60)) % 60).padStart(2, '0');
  const sign = diff >= 0 ? '+' : '-';

  return `${sign}${hours}:${minutes}`;
}

/**
 * Fetches Google Calendar events from the given calendar IDs within the given time range.
 * @param {Object} tokens - The Google OAuth2 tokens.
 * @param {string[]} calendarIds - The IDs of the Google Calendars to fetch events from.
 * @param {string[]} taskListIds - The IDs of the Google Tasks to fetch events from.
 * @param {string} minTime - The minimum time of the events to fetch.
 * @param {string} maxTime - The maximum time of the events to fetch.
 * @returns {Promise<Object>} - The fetched events and tasks.
 */
async function fetchGoogleCalendarData(
  tokens,
  calendarIds,
  taskListIds,
  minTime,
  maxTime
) {
  defaultLogger.info(
    `Fetching Google Calendar events from ${minTime} to ${maxTime}`
  );
  defaultLogger.info(`Tokens: ${JSON.stringify(tokens)}`);
  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const REDIRECT_URI = process.env.REDIRECT_URI || "http://localhost:5173/settings";

  const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  auth.setCredentials(tokens);

  const calendar = google.calendar({ version: "v3", auth });
  const googleTasks = google.tasks({ version: "v1", auth });

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
          orderBy: "startTime",
        });
      
        const events = eventsResponse.data.items.map((event) => ({
          ...event,
          calendarId, // Add the calendarId to each event
        }));
      
        allEvents.push(...events);
    }

    // Fetch tasks from each task list
    for (const taskListId of taskListIds) {
      const tasksResponse = await googleTasks.tasks.list({
        tasklist: taskListId,
      });

      const tasks = tasksResponse.data.items.map((task) => ({
        ...task,
        taskListId, // Add the taskListId to each task
      }));

      taskItems.push(...tasks);
    }

    return { events: allEvents, tasks: taskItems };
  } catch (error) {
    console.error("Error fetching Google Calendar events:", error);
    throw error;
  }
}

/**
 * Updates a Google Calendar event with the given updates.
 * @param {Map<String, String>} tokens
 * @param {String} calendarId
 * @param {String} eventId
 * @param {any} body
 * @returns {Promise<Object>} - The updated event.
 */
async function updateGoogleCalendarEvent(tokens, calendarId, eventId, body) {
  const { updates } = body

  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const REDIRECT_URI = process.env.REDIRECT_URI || "http://localhost:5173/settings";

  const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  auth.setCredentials(tokens);

  const calendar = google.calendar({ version: "v3", auth });
  const calendarInfo = await calendar.calendars.get({ calendarId })
  const calendarTimeZone = calendarInfo.data.timeZone

  const event = await calendar.events.get({
    calendarId: calendarId,
    eventId: eventId
  })

  const eventData = event.data
  defaultLogger.info(`${convertUTCToTimeZone(new Date(updates.end.dateTime).toISOString(), "-05:00")}`)

  try {
    const response = await calendar.events.patch({
      calendarId: calendarId,
      eventId: eventId,
      requestBody: {
        eventType: eventData.eventType,
        summary: updates.summary,
        description: updates.description,
        end: {
          dateTime: convertUTCToTimeZone(new Date(updates.end.dateTime).toISOString(), "-05:00"), // TODO: Actually get the offset
          timeZone: calendarTimeZone
        },
        start: {
          dateTime: convertUTCToTimeZone(new Date(updates.start.dateTime).toISOString(), "-05:00"), // TODO: Actually get the offset
          timeZone: calendarTimeZone
        },
        id: eventData.id
      }
    });

    return response.data;
  } catch (error) {
    defaultLogger.error(`Error updating Google Calendar event: ${error}`);
    defaultLogger.error(`Error details: ${JSON.stringify(error.response?.data)}`);
    throw error;
  }
}

/**
 * Updates a Google Task with the given updates.
 * @param {Map<String, String>} tokens
 * @param {String} taskListId
 * @param {String} taskId
 * @param {Map<String, any>} updates
 * @returns {Promise<Object>} - The updated task.
 */
async function updateGoogleTask(tokens, taskListId, taskId, updates) {
  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const REDIRECT_URI = process.env.REDIRECT_URI || "http://localhost:5173/settings";

  const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  auth.setCredentials(tokens);

  const tasks = google.tasks({ version: "v1", auth });

  try {
    const response = await tasks.tasks.patch({
      tasklist: taskListId,
      taskId: taskId,
      requestBody: updates,
    });

    return response.data;
  } catch (error) {
    console.error("Error updating Google Task:", error);
    throw error;
  }
}

module.exports = {
  fetchGoogleEvents: fetchGoogleCalendarData,
  updateGoogleCalendarEvent: updateGoogleCalendarEvent,
  updateGoogleTask: updateGoogleTask,
};
