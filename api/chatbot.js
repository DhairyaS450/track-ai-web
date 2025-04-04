// /api/chatbot.js
import { processChatMessage } from '../lib/controllers/chatbotController';
import { isAuthenticated } from '../lib/middleware/auth';

// The main handler for the Vercel serverless function
export default async function handler(req, res) {
  // Set common CORS headers
  res.setHeader('Access-Control-Allow-Origin', ['https://tidaltasks.app', 'https://tasktide-ai.vercel.app']); // Adjust if needed for local dev
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Authenticate
  const isAuthenticatedResult = await isAuthenticated(req);
  if (!isAuthenticatedResult) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Route based on path
  const url = new URL(req.url, `http://${req.headers.host}`); // Base URL needed for parsing

  if (req.method === 'POST') {
    try {
      const { message, context } = req.body;
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }
      const response = await processChatMessage(message, req.user, context);
      return res.status(200).json({ response }); // Keep original structure
    } catch (error) {
      console.error('Error processing chat message:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Handle unsupported methods for root path
  res.setHeader('Allow', ['OPTIONS', 'POST']);
  res.status(405).json({ error: `Method ${req.method} not allowed for ${url.pathname}` });
}
