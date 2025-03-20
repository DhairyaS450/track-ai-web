const admin = require('../config/firebase-admin');
const { defaultLogger } = require('../utils/log');

const verifyToken = async (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    defaultLogger.debug('Verifying Firebase token...');
    const decodedToken = await admin.auth().verifyIdToken(token);
    defaultLogger.info(`Firebase token verified successfully for user ${decodedToken.uid}`);
    return decodedToken;
  } catch (error) {
    defaultLogger.error('Error verifying Firebase token:', {
      error: error.message,
      stack: error.stack,
    });
    throw new Error('Invalid token');
  }
};

const isAuthenticated = async (req) => {
  try {
    const authHeader = req.headers.authorization;
    const decodedToken = await verifyToken(authHeader);
    req.user = decodedToken; // Attach user info to the request
    return true;
  } catch (error) {
    defaultLogger.info('Authentication failed:', { message: error.message });
    return false;
  }
};

module.exports = {
  isAuthenticated,
};
