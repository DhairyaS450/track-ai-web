import { isAuthenticated } from '../../lib/middleware/auth.js';
import { getConnectionStatus } from '../../lib/controllers/calendarController.js';
// import { defaultLogger } from '../../lib/utils/log.js';

export default async function handler(req, res) {
  // Handle preflight requests for CORS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    return res.status(204).end(); // No Content
  }
  
  const isAuthenticatedResult = await isAuthenticated(req);
  if (!isAuthenticatedResult) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return getConnectionStatus(req, res);
}
