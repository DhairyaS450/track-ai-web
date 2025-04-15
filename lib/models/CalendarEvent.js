const { getFirestore } = require("firebase-admin/firestore");
const { defaultLogger } = require("../utils/log");
const { format } = require("date-fns");

const db = getFirestore();

class CalendarEvent {
  static async create(userId, eventData) {
    try {
      // Log entry point and basic info
      defaultLogger.info(`Processing event: ${eventData.id}, Summary: ${eventData.summary}`);
      defaultLogger.info(`Raw event data: ${JSON.stringify(eventData)}`);

      // Check if the event is actually a task or deadline (short duration)
      // Added check for dateTime presence to prevent errors
      if (eventData.start && eventData.end && eventData.start.dateTime && eventData.end.dateTime) { 
        try {
            const start = new Date(eventData.start.dateTime).getTime();
            const end = new Date(eventData.end.dateTime).getTime();
            if (!isNaN(start) && !isNaN(end) && end - start <= 60 * 1000) { 
              defaultLogger.info(`Event ${eventData.id} has short duration (${end-start}ms). Treating as task.`);
              return this.createTask(userId, eventData);
            }
        } catch(dateError) {
             defaultLogger.error(`Error calculating duration for event ${eventData.id}: ${dateError}. Raw start/end: ${JSON.stringify(eventData.start)} / ${JSON.stringify(eventData.end)}`);
        }
      }

      if (eventData.eventType === "task") {
        defaultLogger.info(`Event ${eventData.id} has eventType 'task'. Treating as task.`);
        return this.createTask(userId, eventData);
      }

      // If none of the above, proceed as a regular event
      defaultLogger.info(`Event ${eventData.id} is a regular or all-day event. Proceeding to save to 'events' collection.`);
      defaultLogger.info(`Creating/updating event with data ${JSON.stringify(eventData)}`);

      // This is a regular or all-day calendar event
      const docRef = db.collection("events").doc(eventData.id);
      const currentDoc = await docRef.get();

      // Determine if it's an all-day event
      const isAllDay = !!(eventData.start && eventData.start.date);
      defaultLogger.info(`Event ${eventData.id} isAllDay: ${isAllDay}`);

      // Safely extract date/time information
      let startTime, endTime;
      try {
        if (isAllDay) {
          // For all-day events, store the date string exactly as received from Google (YYYY-MM-DD format)
          // Do not convert to Date objects to avoid timezone shifts
          startTime = eventData.start.date;
          defaultLogger.info(`All-day event start date: ${startTime}`);
          
          // BUGFIX: Google Calendar uses an exclusive end date (the day after the event ends)
          // So for display purposes, we need to subtract one day from the end date
          if (eventData.end && eventData.end.date) {
            // Get the end date from Google and convert to a Date object
            const endDate = new Date(eventData.end.date);
            // Subtract one day to get the actual last day of the event
            endDate.setDate(endDate.getDate() - 1);
            // Format back to YYYY-MM-DD
            endTime = endDate.toISOString().split('T')[0];
            defaultLogger.info(`All-day event adjusted end date: ${endTime} (original: ${eventData.end.date})`);
          } else {
            // If no end date provided, use start date as end date
            endTime = startTime;
          }

          // Important logging to debug multi-day event handling
          defaultLogger.info(`All-day event ${eventData.id} spans from ${startTime} to ${endTime}`);
        } else if (eventData.start && eventData.start.dateTime) {
          // BUGFIX: Don't convert timezone, store the original dateTime string
          // This preserves the timezone information that comes from Google Calendar
          startTime = eventData.start.dateTime;
          defaultLogger.info(`Timed event original start: ${startTime}`);
          
          if (eventData.end && eventData.end.dateTime) {
            endTime = eventData.end.dateTime;
            defaultLogger.info(`Timed event original end: ${endTime}`);
            
            // Validate end time is after start time
            const startDate = new Date(startTime);
            const endDate = new Date(endTime);
            if (endDate <= startDate) {
              // Default to 1 hour duration if end time is invalid
              const oneHourLater = new Date(startDate.getTime() + 60 * 60 * 1000);
              // Preserve original timezone format by copying from start
              const tzPart = startTime.substring(startTime.length - 6); // get timezone part like "-04:00"
              endTime = oneHourLater.toISOString().replace("Z", tzPart);
              defaultLogger.warn(`Event ${eventData.id} had invalid end time (before start). Set to 1 hour after start.`);
            }
          } else {
            // Default to 1 hour after start if no end time
            const startDate = new Date(startTime);
            const oneHourLater = new Date(startDate.getTime() + 60 * 60 * 1000);
            // Preserve original timezone format by copying from start
            const tzPart = startTime.substring(startTime.length - 6); // get timezone part like "-04:00"
            endTime = oneHourLater.toISOString().replace("Z", tzPart);
            defaultLogger.warn(`Event ${eventData.id} missing end time. Set to 1 hour after start.`);
          }
        } else {
            startTime = null;
            endTime = null;
            defaultLogger.warn(`Event ${eventData.id} has missing start date/dateTime. Setting times to null.`);
        }
      } catch (error) {
        defaultLogger.error(`Error formatting date/time for event ${eventData.id}: ${error}`);
        // Fallback for timed events if formatting fails
        if (isAllDay && eventData.start?.date) {
          startTime = eventData.start.date;
          endTime = eventData.end?.date || startTime;
        } else {
          startTime = eventData.start?.dateTime || null;
          endTime = eventData.end?.dateTime || startTime;
        }
      }

      const eventPayload = {
        name: eventData.summary || "",
        description: eventData.description || "",
        startTime: startTime,
        endTime: endTime,
        isAllDay: isAllDay,
        location: eventData.location || "",
        recurrence: eventData.recurrence || null,
        updatedAt: new Date(),
        calendarId: eventData.calendarId,
        source: "google_calendar",
      };

      // Log the final payload for debugging
      defaultLogger.info(`Final event payload for ${eventData.id}: ${JSON.stringify({
        ...eventPayload,
        updatedAt: eventPayload.updatedAt.toISOString()
      })}`);

      if (currentDoc.exists) {
        defaultLogger.info(`Updating existing event ${eventData.id} in Firestore.`);
        await docRef.update(eventPayload);
      } else {
        defaultLogger.info(`Creating new event ${eventData.id} in Firestore.`);
        await docRef.set({
          ...eventPayload,
          userId: userId,
          googleEventId: eventData.id,
          createdAt: new Date(),
        });
      }
      return docRef.id;
    } catch (error) {
      defaultLogger.error(`Error creating/updating calendar event ${eventData.id}: ${error.stack || error}`);
      throw error;
    }
  }

  static async createTask(userId, taskData) {
    try {
      const docRef = db.collection("tasks").doc(taskData.id);
      const currentDoc = await docRef.get();

      defaultLogger.info(`Creating task with data ${JSON.stringify(taskData)}`);

      // Safely determine deadline
      let deadline;
      try {
        if (taskData.due && taskData.due.dateTime) {
          deadline = format(new Date(taskData.due.dateTime), "yyyy-MM-dd'T'HH:mm");
        } else if (taskData.due) {
          deadline = format(new Date(taskData.due), "yyyy-MM-dd'T'HH:mm");
        } else if (taskData.end && taskData.end.dateTime) {
          deadline = format(new Date(taskData.end.dateTime), "yyyy-MM-dd'T'HH:mm");
        } else {
          deadline = null;
        }
      } catch (error) {
        defaultLogger.error(`Error formatting deadline for task ${taskData.id}: ${error}`);
        // Use fallback formatting
        if (taskData.due && taskData.due.dateTime) {
          deadline = taskData.due.dateTime.slice(0, 16);
        } else if (taskData.due) {
          deadline = taskData.due.slice(0, 16);
        } else if (taskData.end && taskData.end.dateTime) {
          deadline = taskData.end.dateTime.slice(0, 16);
        } else {
          deadline = null;
        }
      }

      if (currentDoc.exists) {
        await docRef.update({
          title: taskData.title || taskData.summary || "",
          description: taskData.notes || taskData.description || "",
          deadline: deadline,
          status: taskData.status === "completed" ? "completed" : "todo",
          priority: "Medium",
          recurrence: taskData.recurrence || "none",
          updatedAt: new Date(),
          taskListId: taskData.taskListId || taskData.calendarId,
          source: taskData.taskListId ? "google_tasks" : "google_calendar",
        });
      } else {
        await docRef.set({
          userId: userId,
          googleEventId: taskData.id,
          title: taskData.title || taskData.summary || "",
          description: taskData.notes || taskData.description || "",
          deadline: deadline,
          status: taskData.status === "completed" ? "completed" : "todo",
          priority: "Medium",
          recurrence: taskData.recurrence || "none",
          timeSlots: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          source: taskData.taskListId ? "google_tasks" : "google_calendar",
          taskListId: taskData.taskListId || taskData.calendarId,
        });
      }
      return docRef.id;
    } catch (error) {
      defaultLogger.error(`Error creating calendar task: ${error}`);
      throw error;
    }
  }

  static async getByUserId(userId) {
    try {
      const snapshot = await db
        .collection("events")
        .where("userId", "==", userId)
        .where("source", "==", "google_calendar")
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      defaultLogger.error(`Error fetching calendar events: ${error}`);
      throw error;
    }
  }

  static async deleteByGoogleId(userId, googleEventId) {
    try {
      const snapshot = await db
        .collection("events")
        .where("userId", "==", userId)
        .where("googleEventId", "==", googleEventId)
        .get();

      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      defaultLogger.info(
        `Deleted calendar event with Google ID: ${googleEventId}`
      );
    } catch (error) {
      defaultLogger.error(`Error deleting calendar event: ${error}`);
      throw error;
    }
  }
}

module.exports = CalendarEvent;
