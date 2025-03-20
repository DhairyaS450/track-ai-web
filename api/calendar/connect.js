import { connectCalendar } from '../../lib/controllers/calendarController.js';
import { defaultLogger } from '../../lib/utils/log.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    defaultLogger.info('Received calendar connect request');
    
    // We'll handle authentication in the controller function
    return await connectCalendar(req, res);
  } catch (error) {
    defaultLogger.error(`Error in calendar connect handler: ${error.message}\n${error.stack}`);
    return res.status(500).json({ error: error.message });
  }
}