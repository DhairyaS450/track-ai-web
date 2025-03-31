const { getFirestore } = require("firebase-admin/firestore");
const { defaultLogger } = require("../utils/log");
const { format } = require("date-fns");

const db = getFirestore();

class CalendarEvent {
  static async create(userId, eventData) {
    try {
      // Log entry point and basic info
      defaultLogger.info(`Processing event: ${eventData.id}, Summary: ${eventData.summary}`);

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
             // Depending on requirements, might want to decide how to handle this error (e.g., skip, log, try default save)
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

      // Safely extract date/time information
      let startTime, endTime;
      try {
        if (isAllDay) {
          // For all-day events, store the date string directly. 
          // Google Calendar's end date for all-day events is exclusive, so we might not need it directly,
          // depending on how the frontend uses it. Let's store the start date for both for now.
          // Consider adjusting if the frontend needs the exclusive end date.
          startTime = eventData.start.date; // e.g., "2024-03-31"
          endTime = eventData.start.date;   // Store start date as end for consistency? Or use eventData.end.date? Check frontend usage.
                                          // Let's use eventData.start.date for simplicity unless issues arise.
        } else if (eventData.start && eventData.start.dateTime) {
          // For timed events
          startTime = format(new Date(eventData.start.dateTime), "yyyy-MM-dd'T'HH:mm");
          endTime = eventData.end && eventData.end.dateTime
            ? format(new Date(eventData.end.dateTime), "yyyy-MM-dd'T'HH:mm")
            : startTime; // Fallback if end time is missing somehow
        } else {
            startTime = null;
            endTime = null;
            defaultLogger.warn(`Event ${eventData.id} has missing start date/dateTime. Setting times to null.`);
        }
      } catch (error) {
        defaultLogger.error(`Error formatting date/time for event ${eventData.id}: ${error}`);
        // Fallback for timed events if formatting fails
        startTime = eventData.start && eventData.start.dateTime 
          ? eventData.start.dateTime.slice(0, 16) 
          : null;
        endTime = eventData.end && eventData.end.dateTime
          ? eventData.end.dateTime.slice(0, 16)
          : startTime; // Fallback
      }

      const eventPayload = {
        name: eventData.summary || "",
        description: eventData.description || "",
        startTime: startTime,
        endTime: endTime,
        isAllDay: isAllDay, // Add the isAllDay flag
        location: eventData.location || "",
        recurrence: eventData.recurrence || null, // Google API might return recurrence rules
        updatedAt: new Date(),
        calendarId: eventData.calendarId, // Storing the source Google Calendar ID
        source: "google_calendar", // Ensure source is set
      };

      if (currentDoc.exists) {
        defaultLogger.info(`Updating existing event ${eventData.id} in Firestore.`);
        await docRef.update(eventPayload);
      } else {
        defaultLogger.info(`Creating new event ${eventData.id} in Firestore.`);
        await docRef.set({
          ...eventPayload,
          userId: userId,
          googleEventId: eventData.id, // Keep track of the original Google ID
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
