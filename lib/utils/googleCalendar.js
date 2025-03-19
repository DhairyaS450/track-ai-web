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
      try {
        defaultLogger.info(`Fetching events from calendar: ${calendarId}`);
        const eventsResponse = await calendar.events.list({
          calendarId: calendarId,
          timeMin: new Date(minTime).toISOString(),
          timeMax: new Date(maxTime).toISOString(),
          singleEvents: true,
          orderBy: "startTime",
          maxResults: 2500, // Reasonable limit to prevent excessive data
        });
      
        // Process and normalize events
        const events = eventsResponse.data.items
          .filter(event => {
            // Filter out events without start/end times
            return (event.start && (event.start.dateTime || event.start.date)) && 
                   (event.end && (event.end.dateTime || event.end.date));
          })
          .map((event) => ({
            ...event,
            calendarId, // Add the calendarId to each event
          }));
      
        allEvents.push(...events);
        defaultLogger.info(`Fetched ${events.length} events from calendar: ${calendarId}`);
      } catch (error) {
        defaultLogger.error(`Error fetching events from calendar ${calendarId}: ${error.message}`);
        // Continue with other calendars even if one fails
      }
    }

    // Fetch tasks from each task list
    for (const taskListId of taskListIds) {
      try {
        defaultLogger.info(`Fetching tasks from task list: ${taskListId}`);
        const tasksResponse = await googleTasks.tasks.list({
          tasklist: taskListId,
          showCompleted: true,
          showHidden: false,
          maxResults: 100,
        });

        // Process and normalize tasks
        const tasks = (tasksResponse.data.items || [])
          .filter(task => task.title && task.title.trim() !== '') // Filter out tasks with empty titles
          .map((task) => ({
            ...task,
            taskListId, // Add the taskListId to each task
          }));

        taskItems.push(...tasks);
        defaultLogger.info(`Fetched ${tasks.length} tasks from task list: ${taskListId}`);
      } catch (error) {
        defaultLogger.error(`Error fetching tasks from task list ${taskListId}: ${error.message}`);
        // Continue with other task lists even if one fails
      }
    }

    defaultLogger.info(`Total events fetched: ${allEvents.length}, Total tasks fetched: ${taskItems.length}`);
    return { events: allEvents, tasks: taskItems };
  } catch (error) {
    defaultLogger.error(`Error fetching Google Calendar data: ${error.message}`);
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
  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const REDIRECT_URI = process.env.REDIRECT_URI || "http://localhost:5173/settings";

  if (!calendarId || !eventId) {
    throw new Error('Calendar ID and Event ID are required');
  }

  const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  auth.setCredentials(tokens);

  const calendar = google.calendar({ version: "v3", auth });
  
  try {
    // First get the calendar timezone
    const calendarInfo = await calendar.calendars.get({ calendarId });
    const calendarTimeZone = calendarInfo.data.timeZone;
    
    // Get the current event to preserve any fields we're not updating
    const event = await calendar.events.get({
      calendarId: calendarId,
      eventId: eventId
    });
    
    const eventData = event.data;
    const updates = body.updates || body;
    
    // Prepare the update request body
    const requestBody = {
      ...eventData,
      summary: updates.summary || eventData.summary,
      description: updates.description || eventData.description,
      location: updates.location || eventData.location,
    };
    
    // Only update start/end if provided in updates
    if (updates.start) {
      requestBody.start = {
        ...eventData.start,
        ...updates.start,
        timeZone: updates.start.timeZone || calendarTimeZone
      };
    }
    
    if (updates.end) {
      requestBody.end = {
        ...eventData.end,
        ...updates.end,
        timeZone: updates.end.timeZone || calendarTimeZone
      };
    }
    
    // Log the request for debugging
    defaultLogger.info(`Updating event with request body: ${JSON.stringify(requestBody)}`);
    
    const response = await calendar.events.patch({
      calendarId: calendarId,
      eventId: eventId,
      requestBody: requestBody
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

  if (!taskListId || !taskId) {
    throw new Error('Task List ID and Task ID are required');
  }

  const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  auth.setCredentials(tokens);

  const tasks = google.tasks({ version: "v1", auth });

  try {
    // First get the current task to preserve any fields we're not updating
    const task = await tasks.tasks.get({
      tasklist: taskListId,
      task: taskId
    });
    
    const taskData = task.data;
    
    // Prepare the update request body
    const requestBody = {
      ...taskData,
      title: updates.title || taskData.title,
      notes: updates.notes || updates.description || taskData.notes,
      status: updates.status || taskData.status,
      due: updates.due || taskData.due
    };
    
    // Format due date if it exists
    if (updates.due) {
      if (typeof updates.due === 'string') {
        // If it's just a date string without time, append T00:00:00.000Z
        if (updates.due.length === 10) { // YYYY-MM-DD format
          requestBody.due = `${updates.due}T00:00:00.000Z`;
        } else {
          // Ensure it's in proper ISO format
          requestBody.due = new Date(updates.due).toISOString();
        }
      } else if (updates.due.dateTime) {
        requestBody.due = new Date(updates.due.dateTime).toISOString();
      }
    }
    
    // Log the request for debugging
    defaultLogger.info(`Updating task with request body: ${JSON.stringify(requestBody)}`);
    
    const response = await tasks.tasks.patch({
      tasklist: taskListId,
      task: taskId,
      requestBody: requestBody,
    });

    return response.data;
  } catch (error) {
    defaultLogger.error(`Error updating Google Task: ${error}`);
    defaultLogger.error(`Error details: ${JSON.stringify(error.response?.data)}`);
    throw error;
  }
}

module.exports = {
  fetchGoogleEvents: fetchGoogleCalendarData,
  updateGoogleCalendarEvent: updateGoogleCalendarEvent,
  updateGoogleTask: updateGoogleTask,
};
