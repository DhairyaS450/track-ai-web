const express = require('express');
const { isAuthenticated } = require('./middleware/auth');
const { getAuthUrl, connectCalendar, getConnectionStatus, syncGoogleEvents, getEvents } = require('../controllers/calendarController');
const { defaultLogger } = require('../utils/log');

const router = express.Router();

router.get('/auth-url', isAuthenticated, getAuthUrl);
router.post('/connect', isAuthenticated, (req, res, next) => {
  defaultLogger.info('Received calendar connect request', {
    body: req.body,
    headers: req.headers
  });
  connectCalendar(req, res, next);
});
router.get('/status', isAuthenticated, getConnectionStatus);
router.post('/sync', isAuthenticated, (req, res, next) => {
  defaultLogger.info('Received calendar sync request', {
    body: req.body,
    headers: req.headers
  });
  syncGoogleEvents(req, res, next);
});
router.get('/events', isAuthenticated, getEvents);

module.exports = router;