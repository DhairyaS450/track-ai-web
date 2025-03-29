import { getConflictResolutionSuggestion } from '../../lib/controllers/chatbotController'; // Adjusted path
import { isAuthenticated } from '../../lib/middleware/auth'; // Adjusted path

// The main handler for the Vercel serverless function
export default async function handler(req, res) {
  // Set common CORS headers
  // Adjust origins as needed for local dev, preview, and production
  res.setHeader('Access-Control-Allow-Origin', '*'); // Use specific origins in production
  // res.setHeader('Access-Control-Allow-Origin', ['https://tidaltasks.app', 'https://tasktide-ai.vercel.app']);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Only allow POST method for this endpoint
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST', 'OPTIONS']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  // Authenticate
  const isAuthenticatedResult = await isAuthenticated(req);
  if (!isAuthenticatedResult) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Process the suggestion request
  try {
    const { item1, item2, context } = req.body;
    if (!item1 || !item2) {
      return res.status(400).json({ error: 'Conflicting items (item1, item2) are required' });
    }

    const suggestionResult = await getConflictResolutionSuggestion(item1, item2, req.user, context);
    // Return the suggestion and action directly
    return res.status(200).json(suggestionResult);
  } catch (error) {
    console.error('Error getting conflict resolution suggestion:', error);
    return res.status(500).json({ 
      suggestion: "Failed to get suggestion due to a server error.", 
      action: null, 
      error: error.message 
    });
  }
}
