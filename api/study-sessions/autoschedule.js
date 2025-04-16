import { getUserFromRequest } from '../../lib/utils/api';
import { autoScheduleStudySessions } from '../../lib/controllers/studySessionController';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate the user
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Set user on request object for the controller
    req.user = user;

    // Call the controller function
    return autoScheduleStudySessions(req, res);
  } catch (error) {
    console.error('Error in study session auto-scheduler API:', error);
    return res.status(500).json({ error: error.message });
  }
}
