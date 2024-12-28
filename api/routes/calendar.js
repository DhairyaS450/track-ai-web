const express = require('express');
const { isAuthenticated } = require('./middleware/auth');
const { getAuthUrl, connectCalendar, getConnectionStatus } = require('../controllers/calendarController');
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

module.exports = router;