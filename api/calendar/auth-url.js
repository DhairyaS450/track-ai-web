import { isAuthenticated } from '../../lib/middleware/auth.js';
import { getAuthUrl } from '../../lib/controllers/calendarController.js';

export default async function handler(req, res) {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return getAuthUrl(req, res);
}