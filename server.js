const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import routes
const testRoutes = require('./routes/test');
const userRoutes = require('./routes/users');
const listingRoutes = require('./routes/listings');

// Import database connection
const { testConnection } = require('./database/postgres');

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to PostgreSQL on startup
testConnection().catch(err => {
  console.error('Failed to connect to PostgreSQL:', err);
});

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Routes - MUST come before static files
app.use('/api/test', testRoutes);
app.use('/api/users', userRoutes);
app.use('/api/listings', listingRoutes);

// API Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Khaane Me Kya Hai API Server',
    version: '1.0.0',
    database: 'Supabase PostgreSQL',
    endpoints: {
      test: '/api/test/test-db',
      users: '/api/users',
      listings: '/api/listings'
    }
  });
});

// Serve static files from React build folder
app.use(express.static(path.join(__dirname, '../build')));

// Handle React routing, return all requests to React app (except API)
app.get(/.*/, (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/`);
});

module.exports = app;
