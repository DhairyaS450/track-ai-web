const { getFirestore } = require("firebase-admin/firestore");
const { defaultLogger } = require("../utils/log");
const { format } = require("date-fns");

const db = getFirestore();

class CalendarEvent {
  static async create(userId, eventData) {
    try {
      // Check if it is an all-day event
      if (eventData.start && eventData.start.date) {
        // Handle all-day events differently if needed
        return;
      }

      // Check if the event is actually a task or deadline
      if (eventData.start && eventData.end) {
        const start = new Date(eventData.start.dateTime).getTime();
        const end = new Date(eventData.end.dateTime).getTime();
        if (end - start <= 60 * 1000) { // Deadlines in google calendar usually have a duration of less than 1 minute
          return this.createTask(userId, eventData);
        }
      }

      if (eventData.eventType === "task") {
        return this.createTask(userId, eventData);
      }

      // This is a regular calendar event
      const docRef = db.collection("events").doc(eventData.id);
      const currentDoc = await docRef.get();

      // Safely extract date/time information
      let startTime, endTime;
      try {
        startTime = eventData.start && eventData.start.dateTime 
          ? format(new Date(eventData.start.dateTime), "yyyy-MM-dd'T'HH:mm")
          : null;
        
        endTime = eventData.end && eventData.end.dateTime
          ? format(new Date(eventData.end.dateTime), "yyyy-MM-dd'T'HH:mm")
          : null;
      } catch (error) {
        defaultLogger.error(`Error formatting date/time for event ${eventData.id}: ${error}`);
        // Use fallback formatting
        startTime = eventData.start && eventData.start.dateTime 
          ? eventData.start.dateTime.slice(0, 16)
          : null;
        
        endTime = eventData.end && eventData.end.dateTime
          ? eventData.end.dateTime.slice(0, 16)
          : null;
      }

      if (currentDoc.exists) {
        await docRef.update({
          name: eventData.summary || "",
          description: eventData.description || "",
          startTime: startTime,
          endTime: endTime,
          location: eventData.location || "",
          recurrence: eventData.recurrence || null,
          updatedAt: new Date(),
          calendarId: eventData.calendarId,
        });
      } else {
        await docRef.set({
          userId: userId,
          googleEventId: eventData.id,
          name: eventData.summary || "",
          description: eventData.description || "",
          startTime: startTime,
          endTime: endTime,
          location: eventData.location || "",
          recurrence: eventData.recurrence || null,
          createdAt: new Date(),
          updatedAt: new Date(),
          source: "google_calendar",
          calendarId: eventData.calendarId,
        });
      }
      return docRef.id;
    } catch (error) {
      defaultLogger.error(`Error creating calendar event: ${error}`);
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
