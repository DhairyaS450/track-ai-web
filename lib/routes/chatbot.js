const express = require('express');
const router = express.Router();
const { processChatMessage } = require('../controllers/chatbotController');
const { isAuthenticated } = require('./middleware/auth');
const admin = require('firebase-admin');
const serviceAccount = require('../config/firebase-service-account.json');

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

router.options('/api/chatbot', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(204); // No Content
});

router.post('/api/chatbot', isFirebaseAuthenticated, async (req, res) => {
  console.log('POST /chatbot received:', {
    body: req.body,
    headers: req.headers,
    user: req.user,
  });

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

module.exports = router;