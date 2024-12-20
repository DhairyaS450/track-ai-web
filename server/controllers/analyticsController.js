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

const getTaskAnalytics = async (req, res) => {
  try {
    logger.info('Fetching task analytics');
    const userId = req.user.uid;

    // Get all tasks for the user
    const tasksRef = db.collection('tasks');
    const snapshot = await tasksRef.where('userId', '==', userId).get();

    if (snapshot.empty) {
      logger.info('No tasks found for user', { userId });
      return res.json({
        completedTasks: 0,
        overdueTasks: 0,
        completionRates: []
      });
    }

    const tasks = [];
    const now = new Date();
    let completedTasks = 0;
    let overdueTasks = 0;
    const tasksByDate = new Map(); // For tracking completion rates over time

    snapshot.forEach(doc => {
      const task = doc.data();
      tasks.push(task);

      // Count completed tasks
      if (task.status === 'completed') {
        completedTasks++;

        // Group by completion date for time series
        const completionDate = new Date(task.completedAt || task.updatedAt).toISOString().split('T')[0];
        if (!tasksByDate.has(completionDate)) {
          tasksByDate.set(completionDate, { completed: 0, total: 0 });
        }
        tasksByDate.get(completionDate).completed++;
        tasksByDate.get(completionDate).total++;
      } else {
        // Check for overdue tasks
        const deadline = new Date(task.deadline);
        if (deadline < now && task.status !== 'completed') {
          overdueTasks++;
        }

        // Add to total tasks per date
        const creationDate = new Date(task.createdAt).toISOString().split('T')[0];
        if (!tasksByDate.has(creationDate)) {
          tasksByDate.set(creationDate, { completed: 0, total: 0 });
        }
        tasksByDate.get(creationDate).total++;
      }
    });

    // Calculate completion rates over time
    const completionRates = Array.from(tasksByDate.entries())
      .map(([date, stats]) => ({
        date,
        rate: (stats.completed / stats.total) * 100,
        completed: stats.completed,
        total: stats.total
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    logger.info('Successfully calculated task analytics', {
      userId,
      totalTasks: tasks.length,
      completedTasks,
      overdueTasks
    });

    res.json({
      completedTasks,
      overdueTasks,
      completionRates,
      totalTasks: tasks.length
    });
  } catch (error) {
    logger.error('Error getting task analytics:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.uid
    });
    res.status(500).json({
      error: 'An error occurred while fetching task analytics',
      details: error.message
    });
  }
};

module.exports = {
  getStudySessionStats,
  getTaskAnalytics
};