const express = require('express');
const router = express.Router();
const { autoScheduleStudySessions } = require('../controllers/studySessionController');
const { defaultLogger } = require('../utils/log');

// Add a middleware to log all requests to this router
router.use((req, res, next) => {
  defaultLogger.info(`Study Session Route accessed: ${req.method} ${req.originalUrl}`);
  next();
});

// Route for auto-scheduling study sessions
router.post('/autoschedule', (req, res, next) => {
  defaultLogger.info('Auto-schedule endpoint hit', {
    body: req.body,
    headers: req.headers
  });
  return autoScheduleStudySessions(req, res);
});

console.log('Study Sessions routes loaded');
module.exports = router;
