const express = require('express');
const router = express.Router();
const { getStudySessionStats, getTaskAnalytics } = require('../controllers/analyticsController');
const { requireUser } = require('./middleware/auth');
const logger = require('../utils/log').default;
const { getProductivityStats } = require('../controllers/productivityController');

// Study session analytics endpoints
router.get('/study-sessions', requireUser, async (req, res) => {
  try {
    logger.info('Getting study session analytics');
    await getStudySessionStats(req, res);
  } catch (error) {
    logger.error('Error getting study session analytics:', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      error: 'Failed to get study session analytics',
      details: error.message
    });
  }
});

// Task analytics endpoint
router.get('/tasks', requireUser, async (req, res) => {
  try {
    logger.info('Getting task analytics');
    await getTaskAnalytics(req, res);
  } catch (error) {
    logger.error('Error getting task analytics:', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      error: 'Failed to get task analytics',
      details: error.message
    });
  }
});

// Productivity analytics endpoint
router.get('/productivity', requireUser, async (req, res) => {
  try {
    logger.info('Getting productivity analytics');
    await getProductivityStats(req, res);
  } catch (error) {
    logger.error('Error getting productivity analytics:', {
      error: error.message, 
      stack: error.stack
    });
    res.status(500).json({
      error: 'Failed to get productivity analytics',
      details: error.message
    });
  }
});

module.exports = router;