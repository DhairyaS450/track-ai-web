// /api/chatbot.js
import admin from 'firebase-admin';
import { processChatMessage } from '../lib/controllers/chatbotController';
import serviceAccount from '../lib/config/firebase-service-account.json';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
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

// The main handler for the Vercel serverless function
export default async function handler(req, res) {
  // Handle preflight requests for CORS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    return res.status(204).end(); // No Content
  }

  if (req.method === 'POST') {
    // Firebase authentication middleware
    await new Promise((resolve, reject) => {
      isFirebaseAuthenticated(req, res, (err) => (err ? reject(err) : resolve()));
    });

    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const response = await processChatMessage(message, req.user);
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
