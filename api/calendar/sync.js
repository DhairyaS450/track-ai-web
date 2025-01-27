import { syncGoogleEvents } from '../../lib/controllers/calendarController.js';
import { defaultLogger } from '../../lib/utils/log.js';
import { isAuthenticated } from '../../lib/middleware/auth.js';

export default async function handler(req, res) {
  const isAuthenticatedResult = await isAuthenticated(req);
  if (!isAuthenticatedResult) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  defaultLogger.info('Received calendar sync request', {
    body: req.body,
    headers: req.headers,
  });

  return syncGoogleEvents(req, res);
}
