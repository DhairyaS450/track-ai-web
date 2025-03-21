// /api/chatbot.js
import { processChatMessage } from '../lib/controllers/chatbotController';
import { isAuthenticated } from '../lib/middleware/auth';

// The main handler for the Vercel serverless function
export default async function handler(req, res) {
  // Handle preflight requests for CORS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', 'https://tidaltasks.app');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    return res.status(204).end(); // No Content
  }

  if (req.method === 'POST') {
    const isAuthenticatedResult = await isAuthenticated(req);
    if (!isAuthenticatedResult) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const { message, context } = req.body;
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const response = await processChatMessage(message, req.user, context);
      return res.status(200).json({ response });
    } catch (error) {
      console.error('Error processing chat message:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Handle unsupported methods
  res.setHeader('Allow', ['OPTIONS', 'POST']);
  res.status(405).json({ error: `Method ${req.method} not allowed` });
}
