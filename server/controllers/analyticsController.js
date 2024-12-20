const { db } = require('../config/firebase-admin');
const logger = require('../utils/log');

const getStudySessionStats = async (req, res) => {
  try {
    logger.info('Fetching study session statistics');
    const userId = req.user.uid;

    // Get all study sessions for the user
    const sessionsRef = db.collection('studySessions');
    const snapshot = await sessionsRef.where('userId', '==', userId).get();

    if (snapshot.empty) {
      logger.info('No study sessions found for user', { userId });
      return res.json({
        totalStudyTime: 0,
        averageSessionDuration: 0,
        subjectsByTime: []
      });
    }

    let totalStudyTime = 0;
    const subjectTime = {};
    const sessions = [];

    snapshot.forEach(doc => {
      const session = doc.data();
      sessions.push(session);
      totalStudyTime += session.duration || 0;

      // Aggregate time by subject
      if (session.subject) {
        subjectTime[session.subject] = (subjectTime[session.subject] || 0) + (session.duration || 0);
      }
    });

    // Calculate average session duration
    const averageSessionDuration = totalStudyTime / sessions.length;

    // Sort subjects by study time
    const subjectsByTime = Object.entries(subjectTime)
      .map(([subject, time]) => ({ subject, time }))
      .sort((a, b) => b.time - a.time);

    logger.info('Successfully calculated study session statistics', { 
      userId,
      totalSessions: sessions.length,
      totalStudyTime,
      uniqueSubjects: Object.keys(subjectTime).length
    });

    res.json({
      totalStudyTime,
      averageSessionDuration,
      subjectsByTime
    });
  } catch (error) {
    logger.error('Error getting study session stats:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.uid
    });
    res.status(500).json({ 
      error: 'An error occurred while fetching study session statistics',
      details: error.message
    });
  }
};

module.exports = {
  getStudySessionStats
};