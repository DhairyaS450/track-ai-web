// Load environment variables
require("dotenv").config();
const express = require("express");
const session = require("express-session");
const basicRoutes = require("./routes/index");
const authRoutes = require("./routes/auth");
const analyticsRoutes = require("./routes/analytics");
console.log('Loading chatbot routes');
const chatbotRoutes = require('./routes/chatbot');
console.log('Chatbot routes loaded:', typeof chatbotRoutes);
const { authenticateWithToken } = require('./routes/middleware/auth');
const cors = require("cors");

const app = express();
const port = parseInt(process.env.PORT) || 3000;

// Ensure CORS middleware is applied early
console.log('CORS middleware configured with:', {
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.CLIENT_URL, 'https://tidaltasks.app']
    : 'http://localhost:5173',
  credentials: true,
});
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.CLIENT_URL, 'https://tidaltasks.app']
    : 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Handle preflight requests globally
app.options('*', (req, res) => {
  console.log('Preflight request received:', req.method, req.path, req.headers);
  const origin = req.get('origin');
  if (process.env.NODE_ENV === 'production') {
    if (origin === process.env.CLIENT_URL || origin === 'https://tidaltasks.app') {
      res.header('Access-Control-Allow-Origin', origin);
    }
  } else {
    res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(204); // No content
});

// app.use((req, res, next) => {
//   console.log('Incoming request:', {
//     method: req.method,
//     path: req.path,
//     headers: req.headers,
//   });
//   next();
// });

// Pretty-print JSON responses
app.enable('json spaces');
// We want to be consistent with URL paths, so we enable strict routing
app.enable('strict routing');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Authentication routes
app.use(authenticateWithToken);
app.use(authRoutes);

console.log('Session middleware configured with:', {
  secret: !!process.env.SESSION_SECRET,
  cookieSecure: process.env.NODE_ENV === 'production'
});

app.on("error", (error) => {
  console.error(`Server error: ${error.message}`);
  console.error(error.stack);
});

// Basic Routes
app.use(basicRoutes);
// Authentication Routes
app.use('/api/auth', authRoutes);
// Analytics Routes
app.use('/api/analytics', analyticsRoutes);
// Chatbot Routes
app.use(chatbotRoutes);
// Calendar Routes
app.use('/api/calendar', require('./routes/calendar'));

// If no routes handled the request, it's a 404
app.use((req, res, next) => {
  res.status(404).send("Page not found.");
});

// Error handling
app.use((err, req, res, next) => {
  console.error(`Unhandled application error: ${err.message}`);
  console.error(err.stack);
  res.status(500).send("There was an error serving your request.");
});

// Start the server
const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Please use a different port.`);
    process.exit(1);
  } else {
    console.error('Server error:', error);
  }
});