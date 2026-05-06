require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan'); // optional, for request logging
const rateLimiter = require('./middleware/rateLimiter.middleware');
const errorMiddleware = require('./middleware/error.middleware');
const routes = require('./routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev')); // log requests
app.use(rateLimiter);
  
// API Routes
app.use('/api', routes);

// Health check
app.get('/', (req, res) => {
  res.send('Travel Planner API is running...');
});

// Error handling middleware (must be last)
app.use(errorMiddleware);

module.exports = app;
