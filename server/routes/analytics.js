const express = require('express');
const router = express.Router();
const { getStudySessionStats } = require('../controllers/analyticsController');
const { isAuthenticated } = require('./middleware/auth');
const logger = require('../utils/log');

// Study session analytics endpoints
router.get('/study-sessions', isAuthenticated, async (req, res) => {
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

module.exports = router;