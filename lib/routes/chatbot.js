const express = require('express');
const router = express.Router();
const { processChatMessage, getConflictResolutionSuggestion } = require('../controllers/chatbotController');
const { isAuthenticated } = require('./middleware/auth');
const admin = require('firebase-admin');
const serviceAccount = require('../config/firebase-service-account.json');

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const isFirebaseAuthenticated = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

router.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

router.post('/api/chatbot', isFirebaseAuthenticated, async (req, res) => {
  console.log('POST /api/chatbot received:');

  try {
    const { message, context } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await processChatMessage(message, req.user, context);
    res.json({ response });
  } catch (error) {
    console.error('Error processing chat message:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/api/chatbot/suggest-resolution', isFirebaseAuthenticated, async (req, res) => {
  console.log('POST /api/chatbot/suggest-resolution received:');

  try {
    const { item1, item2, context } = req.body;
    if (!item1 || !item2) {
      return res.status(400).json({ error: 'Conflicting items (item1, item2) are required' });
    }

    const suggestionResult = await getConflictResolutionSuggestion(item1, item2, req.user, context);
    res.json(suggestionResult);
  } catch (error) {
    console.error('Error getting conflict resolution suggestion:', error);
    res.status(500).json({ 
      suggestion: "Failed to get suggestion due to a server error.", 
      action: null, 
      error: error.message 
    });
  }
});

module.exports = router;