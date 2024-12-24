const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const admin = require('../config/firebase-admin');
const { defaultLogger } = require('../utils/log');

const db = admin.firestore();

// These should be added to .env
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:5173/settings';

const oauth2Client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events.readonly'
];

exports.getAuthUrl = async (req, res) => {
  try {
    defaultLogger.info('Generating Google Calendar auth URL');
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
    defaultLogger.info('Successfully generated auth URL');
    res.json({ url });
  } catch (error) {
    defaultLogger.error('Error generating auth URL:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.connectCalendar = async (req, res) => {
  try {
    const { code } = req.body;
    const { uid } = req.user;

    defaultLogger.info('Connect calendar request details:', {
      hasCode: !!code,
      codeLength: code?.length,
      uid: uid,
      headers: req.headers
    });

    defaultLogger.info(`Attempting to connect calendar for user ${uid}`);

    if (!code) {
      defaultLogger.error('No authorization code provided');
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    defaultLogger.info('Getting tokens from Google');
    const { tokens } = await oauth2Client.getToken(code);

    defaultLogger.info('Storing tokens in Firestore');
    await db.collection('users').doc(uid).update({
      googleCalendar: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiry: tokens.expiry_date,
      }
    });

    defaultLogger.info(`Google Calendar connected successfully for user ${uid}`);
    res.json({ success: true, message: 'Calendar connected successfully' });
  } catch (error) {
    defaultLogger.error('Error connecting calendar:', error.stack);
    res.status(500).json({ error: error.message });
  }
};

exports.getConnectionStatus = async (req, res) => {
  try {
    const { uid } = req.user;
    defaultLogger.info(`Checking calendar connection status for user ${uid}`);

    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();

    const connected = !!(userData?.googleCalendar?.accessToken);
    defaultLogger.info(`Calendar connection status for user ${uid}: ${connected}`);

    res.json({ connected });
  } catch (error) {
    defaultLogger.error('Error checking calendar connection status:', error.stack);
    res.status(500).json({ error: error.message });
  }
};