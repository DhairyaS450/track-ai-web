const { getFirestore } = require("firebase-admin/firestore");
const { defaultLogger } = require("../utils/log");
const { format } = require("date-fns");

const db = getFirestore();

class CalendarEvent {
  static async create(userId, eventData) {
    try {
      // Check if the event is actually a task or deadline
      const start = new Date(eventData.start.dateTime).getTime();
      const end = new Date(eventData.end.dateTime).getTime();
      if (end - start <= 60 * 1000) { // Deadlines in google calendar usually have a duration of less than 1 minute
        return this.createTask(userId, eventData);
      }

      if (eventData.eventType === "task") {
        return this.createTask(userId, eventData);
      }

      const docRef = db.collection("events").doc(eventData.id);
      const currentDoc = await docRef.get();

      if (currentDoc.exists) {
        await docRef.update({
          name: eventData.summary || "",
          description: eventData.description || "",
          startTime: format(
            new Date(eventData.start.dateTime),
            "yyyy-MM-dd'T'HH:mm"
          ),
          endTime: format(
            new Date(eventData.end.dateTime),
            "yyyy-MM-dd'T'HH:mm"
          ),
          location: eventData.location || "",
          recurrence: eventData.recurrence || null,
          updatedAt: new Date(),
        });
      } else {
        await docRef.set({
          userId: userId,
          googleEventId: eventData.id,
          name: eventData.summary || "",
          description: eventData.description || "",
          startTime: format(
            new Date(eventData.start.dateTime),
            "yyyy-MM-dd'T'HH:mm"
          ),
          endTime: format(
            new Date(eventData.end.dateTime),
            "yyyy-MM-dd'T'HH:mm"
          ),
          location: eventData.location || "",
          recurrence: eventData.recurrence || null,
          createdAt: new Date(),
          updatedAt: new Date(),
          source: "google_calendar",
        });
      }
      // defaultLogger.info(`Created calendar event with ID: ${docRef.id}`);
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

      defaultLogger.info(`Creating task with deadline: ${taskData.due?.dateTime || taskData.end?.dateTime || 'No deadline'}`);

      if (currentDoc.exists) {
        await docRef.update({
          title: taskData.title || taskData.summary || "",
          description: taskData.notes || taskData.description || "",
          deadline: taskData.due
            ? format(new Date(taskData.due.dateTime), "yyyy-MM-dd'T'HH:mm")
            : format(new Date(taskData.end.dateTime), "yyyy-MM-dd'T'HH:mm"),
          status: taskData.status === "completed" ? "completed" : "todo",
          priority: "Medium",
          recurrence: taskData.recurrence || "none",
          updatedAt: new Date(),
        });
      } else {
        await docRef.set({
          userId: userId,
          googleEventId: taskData.id,
          title: taskData.title || taskData.summary || "",
          description: taskData.notes || taskData.description || "",
          deadline: taskData.due
          ? format(new Date(taskData.due?.dateTime), "yyyy-MM-dd'T'HH:mm")
          : format(new Date(taskData.end?.dateTime), "yyyy-MM-dd'T'HH:mm"),
          status: taskData.status === "completed" ? "completed" : "todo",
          priority: "Medium",
          recurrence: taskData.recurrence || "none",
          timeSlots: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          source: "google_calendar",
        });
      }
      // defaultLogger.info(`Created calendar event with ID: ${docRef.id}`);
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

  static async updateCalendar(userId, eventData) {}

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
