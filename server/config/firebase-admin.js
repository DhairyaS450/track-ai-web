const admin = require('firebase-admin');
const { defaultLogger } = require('../utils/log');
const serviceAccount = require('./firebase-service-account.json');

try {
  defaultLogger.info('Initializing Firebase Admin SDK...');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  defaultLogger.info('Firebase Admin SDK initialized successfully');
} catch (error) {
  defaultLogger.error('Failed to initialize Firebase Admin SDK:', error);
  throw error;
}

module.exports = admin;