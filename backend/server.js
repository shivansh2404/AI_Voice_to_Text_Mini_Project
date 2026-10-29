const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const notesRoutes = require('./routes/notes');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai_voice_to_text';

// 1. Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log(' Successfully connected to MongoDB database!');
  })
  .catch((err) => {
    console.error(' MongoDB connection error:', err.message);
    console.log('⚠️ Please ensure MongoDB is running locally or provide a valid MONGO_URI in .env');
  });

// 2. CORS configuration (permits cookie exchanges across ports during development)
app.use(
  cors({
    origin: [
      'http://localhost:5000',
      'http://127.0.0.1:5000',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5500',
      'http://127.0.0.1:5500'
    ],
    credentials: true
  })
);

// 3. Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Session management with MongoDB store
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'voice_to_text_default_session_secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: MONGO_URI,
      collectionName: 'sessions',
      ttl: 24 * 60 * 60 // 1 day
    }),
    cookie: {
      httpOnly: true, // Prevents client-side XSS access to the cookie
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production' // true in production HTTPS
    }
  })
);

// 5. Serve static frontend files
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// 6. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);

// 7. Base route redirect
app.get('/', (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect('/dashboard.html');
  }
  return res.redirect('/login.html');
});

// 8. 404 handler for unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found.'
  });
});

// 9. Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: 'An unexpected internal server error occurred.'
  });
});

// 10. Start the server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  AI Voice to Text Server running successfully!`);
  console.log(`  Port: ${PORT}`);
  console.log(`  URL:  http://localhost:${PORT}`);
  console.log(`  Frontend served from: ${frontendPath}`);
  console.log(`===============================================`);
});

