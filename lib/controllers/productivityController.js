const { db } = require('../config/firebase-admin');
const { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek } = require('date-fns');
const logger = require('../utils/log').default;

const calculateDailyScore = (tasks, sessions) => {
  const totalTaskWeight = 0.6;
  const totalStudyWeight = 0.4;

  const completedTasksScore = tasks.length > 0 ? (tasks.filter(t => t.status === 'completed').length / tasks.length) * 100 : 0;
  const studyMinutes = sessions.reduce((total, session) => total + (session.duration || 0), 0);
  const studyScore = studyMinutes > 0 ? Math.min(100, (studyMinutes / 240) * 100) : 0; // Assuming 4 hours is 100%

  return (completedTasksScore * totalTaskWeight) + (studyScore * totalStudyWeight);
};

exports.getProductivityStats = async (req, res) => {
  logger.info('Getting productivity stats', { userId: req.user.uid });

  try {
    if (!req.user || !req.user.uid) {
      logger.error('User not authenticated');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user.uid;
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);

    logger.info('Fetching tasks and sessions', {
      userId,
      startDate: thirtyDaysAgo,
      endDate: now
    });

    // Get tasks from the last 30 days
    const tasksRef = db.collection('tasks');
    const tasksSnapshot = await tasksRef
      .where('userId', '==', userId)
      .where('createdAt', '>=', thirtyDaysAgo)
      .get()
      .catch(error => {
        logger.error('Error fetching tasks', { error: error.stack });
        throw new Error('Failed to fetch tasks');
      });

    // Get study sessions from the last 30 days
    const sessionsRef = db.collection('studySessions');
    const sessionsSnapshot = await sessionsRef
      .where('userId', '==', userId)
      .where('createdAt', '>=', thirtyDaysAgo)
      .get()
      .catch(error => {
        logger.error('Error fetching study sessions', { error: error.stack });
        throw new Error('Failed to fetch study sessions');
      });

    const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const sessions = sessionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    logger.info('Successfully fetched data', {
      tasksCount: tasks.length,
      sessionsCount: sessions.length
    });

    // Calculate daily stats
    const daily = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(now, i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const dayTasks = tasks.filter(task => {
        const taskDate = task.createdAt?.toDate();
        if (!taskDate) {
          logger.warn('Task missing createdAt date', { taskId: task.id });
          return false;
        }
        return taskDate >= dayStart && taskDate <= dayEnd;
      });

      const daySessions = sessions.filter(session => {
        const sessionDate = session.createdAt?.toDate();
        if (!sessionDate) {
          logger.warn('Session missing createdAt date', { sessionId: session.id });
          return false;
        }
        return sessionDate >= dayStart && sessionDate <= dayEnd;
      });

      const score = calculateDailyScore(dayTasks, daySessions);
      const completedTasks = dayTasks.filter(t => t.status === 'completed').length;
      const studyMinutes = daySessions.reduce((total, session) => total + (session.duration || 0), 0);

      logger.debug('Calculated daily stats', {
        date: dayStart,
        score,
        completedTasks,
        studyMinutes
      });

      return {
        date: dayStart.toISOString(),
        score,
        completedTasks,
        studyMinutes,
      };
    }).reverse();

    // Calculate weekly stats
    const weekly = Array.from({ length: 4 }, (_, i) => {
      const weekStart = startOfWeek(subDays(now, i * 7));
      const weekEnd = endOfWeek(weekStart);

      const weekTasks = tasks.filter(task => {
        const taskDate = task.createdAt?.toDate();
        if (!taskDate) {
          logger.warn('Task missing createdAt date', { taskId: task.id });
          return false;
        }
        return taskDate >= weekStart && taskDate <= weekEnd;
      });

      const weekSessions = sessions.filter(session => {
        const sessionDate = session.createdAt?.toDate();
        if (!sessionDate) {
          logger.warn('Session missing createdAt date', { sessionId: session.id });
          return false;
        }
        return sessionDate >= weekStart && sessionDate <= weekEnd;
      });

      const score = calculateDailyScore(weekTasks, weekSessions);
      const completedTasks = weekTasks.filter(t => t.status === 'completed').length;
      const studyMinutes = weekSessions.reduce((total, session) => total + (session.duration || 0), 0);

      logger.debug('Calculated weekly stats', {
        weekStart,
        weekEnd,
        score,
        completedTasks,
        studyMinutes
      });

      return {
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        score,
        completedTasks,
        studyMinutes,
      };
    }).reverse();

    logger.info('Successfully calculated productivity stats');

    res.json({ daily, weekly });
  } catch (error) {
    logger.error('Error getting productivity stats:', {
      error: error.stack,
      userId: req.user?.uid
    });
    res.status(500).json({ error: 'Failed to get productivity statistics' });
  }
};