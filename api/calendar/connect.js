import { isAuthenticated } from '../../lib/middleware/auth.js';
import { connectCalendar } from '../../lib/controllers/calendarController.js';
import { defaultLogger } from '../../lib/utils/log.js';

export default async function handler(req, res) {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  defaultLogger.info('Received calendar connect request', {
    body: req.body,
    headers: req.headers,
  });

  return connectCalendar(req, res);
}