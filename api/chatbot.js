// /api/chatbot.js
import { processChatMessage, getConflictResolutionSuggestion } from '../lib/controllers/chatbotController';
import { isAuthenticated } from '../lib/middleware/auth';

// The main handler for the Vercel serverless function
export default async function handler(req, res) {
  // Set common CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://tidaltasks.app'); // Adjust if needed for local dev
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
    if (url.pathname === '/api/chatbot') {
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
    } else if (url.pathname === '/api/chatbot/suggest-resolution') {
      try {
        const { item1, item2, context } = req.body;
        if (!item1 || !item2) {
          return res.status(400).json({ error: 'Conflicting items (item1, item2) are required' });
        }
        // context might be optional here, the controller handles null context
        const suggestionResult = await getConflictResolutionSuggestion(item1, item2, req.user, context);
        // Return the suggestion and action directly (not nested in { response: ... })
        return res.status(200).json(suggestionResult);
      } catch (error) {
        console.error('Error getting conflict resolution suggestion:', error);
        return res.status(500).json({ 
          suggestion: "Failed to get suggestion due to a server error.", 
          action: null, 
          error: error.message 
        });
      }
    } else {
      // Handle unknown POST paths
      res.setHeader('Allow', ['POST']);
      return res.status(404).json({ error: `Endpoint ${req.method} ${url.pathname} not found` });
    }
  }

  // Handle unsupported methods for root path
  res.setHeader('Allow', ['OPTIONS', 'POST']);
  res.status(405).json({ error: `Method ${req.method} not allowed for ${url.pathname}` });
}
