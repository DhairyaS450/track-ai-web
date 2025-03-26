const admin = require('firebase-admin');
const { defaultLogger } = require('../utils/log');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Construct the absolute path to the service account key JSON file
const serviceAccountPath = path.join(__dirname, './firebase-service-account.json');
console.log(serviceAccountPath);

// Create a mock Firebase admin object for development
const createMockAdmin = () => {
  defaultLogger.warn('Using mock Firebase admin. Some features will be limited.');
  return {
    firestore: () => ({
      collection: () => ({
        doc: () => ({
          get: async () => ({ exists: false, data: () => ({}) }),
          set: async () => ({}),
          update: async () => ({}),
          delete: async () => ({})
        }),
        add: async () => ({}),
        where: () => ({
          get: async () => ({ docs: [], empty: true }),
          limit: () => ({
            get: async () => ({ docs: [], empty: true })
          })
        })
      })
    }),
    auth: () => ({
      verifyIdToken: async () => ({ uid: 'demo-user-id' }),
      getUser: async () => ({ uid: 'demo-user-id', email: 'demo@example.com' })
    })
  };
};

try {
  // Try to initialize with real credentials
  if (process.env.NODE_ENV === 'production') {
    // In production, we require valid credentials
    const serviceAccount = fs.existsSync(serviceAccountPath) 
      ? require(serviceAccountPath) 
      : {
          type: "service_account",
          project_id: process.env.FIREBASE_PROJECT_ID,
          private_key: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
          private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          client_id: process.env.FIREBASE_CLIENT_ID,
          auth_uri: "https://accounts.google.com/o/oauth2/auth",
          token_uri: "https://oauth2.googleapis.com/token",
          auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
          client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
          universe_domain: "googleapis.com"
        };
    
    if (!admin.apps.length) {
      defaultLogger.info('Initializing Firebase Admin SDK in production...');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      defaultLogger.info('Firebase Admin SDK initialized successfully');
    }
    module.exports = admin;
  } else {
    // In development, we can use mock if credentials aren't valid
    defaultLogger.info('Development environment detected, using mock Firebase admin');
    module.exports = createMockAdmin();
  }
} catch (error) {
  defaultLogger.error('Failed to initialize Firebase Admin SDK:', error);
  
  // If in development, fall back to mock
  if (process.env.NODE_ENV !== 'production') {
    defaultLogger.info('Falling back to mock Firebase admin in development');
    module.exports = createMockAdmin();
  } else {
    // In production, throw the error
    throw error;
  }
}