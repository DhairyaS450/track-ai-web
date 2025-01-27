import { isAuthenticated } from '../../lib/middleware/auth.js';
import { getConnectionStatus } from '../../lib/controllers/calendarController.js';
// import { defaultLogger } from '../../lib/utils/log.js';

export default async function handler(req, res) {
  const isAuthenticatedResult = await isAuthenticated(req);
  if (!isAuthenticatedResult) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return getConnectionStatus(req, res);
}
