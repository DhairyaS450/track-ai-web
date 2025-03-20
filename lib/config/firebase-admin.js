const admin = require('firebase-admin');
const { defaultLogger } = require('../utils/log');
const fs = require('fs');
const path = require('path');

// Construct the absolute path to the service account key JSON file
const serviceAccountPath = path.join(__dirname, '../config/firebase-service-account.json');
console.log(serviceAccountPath);

const getServiceAccount = () => {
  if (fs.existsSync(serviceAccountPath)) {
    console.log('Service account file exists');
    return require(serviceAccountPath);
  } 
  console.log('Service account file does not exist');
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