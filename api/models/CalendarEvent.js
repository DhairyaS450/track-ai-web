const { getFirestore } = require('firebase-admin/firestore');
const { defaultLogger } = require('../utils/log');

const db = getFirestore();

class CalendarEvent {
  static async create(userId, eventData) {
    try {
      // defaultLogger.info(`Creating calendar event for user ${userId} with data: ${JSON.stringify(eventData)}`);
      const docRef = await db.collection('events')
        .doc(eventData.id).set({
          userId: userId,
          googleEventId: eventData.id,
          title: eventData.summary || '',
          description: eventData.description || '',
          startTime: new Date(eventData.start.dateTime).toISOString('yyyy-MM-ddTHH:mm'),
          endTime: new Date(eventData.end.dateTime).toISOString('yyyy-MM-ddTHH:mm'),
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