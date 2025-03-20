const admin = require('firebase-admin');
const { defaultLogger } = require('../../utils/log');

const authenticateWithToken = async (req, res, next) => {
  const authHeader = req.get('Authorization');
  if (authHeader) {
    const m = authHeader.match(/^(Token|Bearer) (.+)/i);
    if (m) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(m[2]);
        defaultLogger.info(`Firebase token verified successfully for user ${decodedToken.uid}`);
        req.user = decodedToken;
        next();
      } catch (error) {
        defaultLogger.error('Error verifying Firebase token:', {
          error: error.message,
          stack: error.stack
        });
        next(error);
      }
      return;
    }
  }

  next();
};

const requireUser = (req, res, next) => {
  if (!req.user) {
    defaultLogger.info('Authentication required but no user found');
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

const isAuthenticated = async function(req, res, next) {
  defaultLogger.info('isAuthenticated middleware called with:', {
    hasUser: !!req.user,
    session: req.session,
    headers: req.headers
  });
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    defaultLogger.info('No token provided in auth header');
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    defaultLogger.debug('Verifying Firebase token...');
    const decodedToken = await admin.auth().verifyIdToken(token);
    defaultLogger.info(`Firebase token verified successfully for user ${decodedToken.uid}`);
    req.user = decodedToken;
    next();
  } catch (error) {
    defaultLogger.error('Error verifying Firebase token:', {
      error: error.message,
      stack: error.stack
    });
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = {
  authenticateWithToken,
  requireUser,
  isAuthenticated
};