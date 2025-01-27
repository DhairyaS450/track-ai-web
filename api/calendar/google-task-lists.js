import { isAuthenticated } from '../../lib/middleware/auth.js';
import { getGoogleTasks } from '../../lib/controllers/calendarController.js';

export default async function handler(req, res) {
  const isAuthenticatedResult = await isAuthenticated(req);
  if (!isAuthenticatedResult) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return getGoogleTasks(req, res);
}
