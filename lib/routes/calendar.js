const express = require('express');
const { isAuthenticated } = require('./middleware/auth');
const { getAuthUrl, connectCalendar, getConnectionStatus, syncGoogleEvents, getEvents, getGoogleCalendars, getGoogleTasks, updateGoogleEvent, updateGoogleTask } = require('../controllers/calendarController');
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
router.get('/google-calendars', isAuthenticated, getGoogleCalendars);
router.get('/google-task-lists', isAuthenticated, getGoogleTasks);
router.get('/status', isAuthenticated, getConnectionStatus);
router.post('/sync', isAuthenticated, (req, res, next) => {
  defaultLogger.info('Received calendar sync request', {
    body: req.body,
    headers: req.headers
  });
  syncGoogleEvents(req, res, next);
});
router.get('/events', isAuthenticated, getEvents);
router.patch('/events/:calendarId/:eventId', isAuthenticated, (req, res, next) => {
  defaultLogger.info('Received calendar event update request', {
    body: req.body,
    headers: req.headers
  });
  updateGoogleEvent(req, res, next);
});
router.patch('/tasks/:taskListId/:taskId', isAuthenticated, (req, res, next) => {
  defaultLogger.info('Received calendar task update request', {
    body: req.body,
    headers: req.headers
  });
  updateGoogleTask(req, res, next);
});

module.exports = router;