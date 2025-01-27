const admin = require('firebase-admin');
const { defaultLogger } = require('../utils/log');
const fs = require('fs');
const getServiceAccount = () => {
  if (fs.existsSync('./firebase-service-account.json')) {
    return require('./firebase-service-account.json');
  } 
  
  // Fallback to environment variables
  return {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
    client_credential_type: "assertion",
    universe_domain: "googleapis.com"
  }
}

const serviceAccount = getServiceAccount();

if (!admin.apps.length) {
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
}
module.exports = admin;