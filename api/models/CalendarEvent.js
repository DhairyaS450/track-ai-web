const { getFirestore } = require('firebase-admin/firestore');
const { defaultLogger } = require('../utils/log');

const db = getFirestore();

class CalendarEvent {
  static async create(userId, eventData) {
    try {
      const docRef = await db.collection('events')
        .doc(eventData.id).set({
          userId: userId,
          googleEventId: eventData.id,
          name: eventData.summary || '',
          description: eventData.description || '',
          startTime: new Date(eventData.start.dateTime).toISOString().slice(0, 16),
          endTime: new Date(eventData.end.dateTime).toISOString().slice(0, 16),
          location: eventData.location || '',
          recurrence: eventData.recurrence || null,
          createdAt: new Date(),
          updatedAt: new Date(),
          source: 'google_calendar'
        });

      // defaultLogger.info(`Created calendar event with ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      // defaultLogger.error(`Error creating calendar event: ${error}`);
      throw error;
    }
  }

  static async createTask(userId, taskData) {
    try {
      const docRef = await db.collection('tasks')
        .doc(taskData.id).set({
          userId: userId,
          googleEventId: taskData.id,
          title: taskData.title || '',
          description: taskData.notes || '',
          deadline: new Date(taskData.due).toISOString().slice(0, 16),
          status: taskData.status === 'completed' ? 'completed' : 'todo',
          priority: 'medium',
          recurrence: taskData.recurrence || 'none',
          timeSlots: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          source: 'google_calendar'
        });

      // defaultLogger.info(`Created calendar event with ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      // defaultLogger.error(`Error creating calendar event: ${error}`);
      throw error;
    }
  }

  static async getByUserId(userId) {
    try {
      const snapshot = await db.collection('events')
        .where('userId', '==', userId)
        .where('source', '==', 'google_calendar')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      defaultLogger.error(`Error fetching calendar events: ${error}`);
      throw error;
    }
  }

  static async deleteByGoogleId(userId, googleEventId) {
    try {
      const snapshot = await db.collection('events')
        .where('userId', '==', userId)
        .where('googleEventId', '==', googleEventId)
        .get();

      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      defaultLogger.info(`Deleted calendar event with Google ID: ${googleEventId}`);
    } catch (error) {
      defaultLogger.error(`Error deleting calendar event: ${error}`);
      throw error;
    }
  }
}

module.exports = CalendarEvent;