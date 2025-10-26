// Load environment variables first
require('dotenv').config();

// Debug environment variables
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  API_URL: process.env.API_URL
});

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { ApolloServer } = require('apollo-server-express');
const typeDefs = require('./schema/types');
const resolvers = require('./schema/resolvers');
const { startDailyUpdates, fetchAndSaveGames } = require('./services/gameService');
const { authMiddleware } = require('./utils/auth');
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const webhookRoutes = require('./routes/webhooks');
const { depositWatcher } = require('./services/depositWatcher');
const { merchantDepositWatcher } = require('./services/merchantDepositWatcher');
const path = require('path');

// Force production port
const PORT = 2053;

// Only require https and fs in production
const https = process.env.NODE_ENV === 'production' ? require('https') : null;
const fs = process.env.NODE_ENV === 'production' ? require('fs') : null;

const app = express();

// Trust proxy settings for production
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// CORS configuration
const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = process.env.NODE_ENV === 'production'
      ? ['https://moonshoot.fun', 'https://www.moonshoot.fun']
      : ['http://localhost:3000'];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Credentials',
    'Access-Control-Allow-Headers',
    'Access-Control-Allow-Methods'
  ],
  exposedHeaders: ['Authorization'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Handle OPTIONS preflight for all routes
app.options('*', cors(corsOptions));

// Security headers for production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    res.set({
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    });
    next();
  });
}

// Middleware
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/webhooks', webhookRoutes);

// Create Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const auth = await authMiddleware(req);
    return auth;
  },
  cache: 'bounded',
  cors: false // Disable Apollo's CORS handling
});

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await server.start();
    
    server.applyMiddleware({ 
      app,
      cors: false, // Disable Apollo's CORS handling
      path: '/graphql'
    });

    // Initialize services
    // When using Supabase scaffolding or when critical payment keys are missing,
    // avoid starting background services that depend on external vendors to allow
    // the server to start for manual migration/testing.
    if (process.env.DB_PROVIDER === 'supabase') {
      console.log('DB_PROVIDER=supabase detected — skipping background services (depositWatcher, merchantDepositWatcher, gameService)');
    } else {
      try {
        await depositWatcher.start();
        await merchantDepositWatcher.start();

        // Initialize games
        console.log('🎮 Starting game service...');
        await fetchAndSaveGames(false);
        await startDailyUpdates();
        console.log('🎮 Game service initialized');
      } catch (svcErr) {
        console.error('Background service failed to start:', svcErr);
        // Continue — we don't want to crash the whole server if a watcher fails.
      }
    }

    // Use forced PORT
    console.log(`Using port: ${PORT}`);

    if (process.env.NODE_ENV === 'production') {
      try {
        const sslOptions = {
          key: fs.readFileSync(path.join(__dirname, '../ssl/private.key')),
          cert: fs.readFileSync(path.join(__dirname, '../ssl/certificate.crt'))
        };
        
        const httpsServer = https.createServer(sslOptions, app);
        httpsServer.listen(PORT, () => {
          console.log(`Production server running on port ${PORT}`);
          console.log(`GraphQL endpoint: ${process.env.API_URL}${server.graphqlPath}`);
        });
      } catch (error) {
        console.error('SSL Error:', error);
        app.listen(PORT, '0.0.0.0', () => {
          console.log(`Production server (HTTP fallback) running on port ${PORT}`);
          console.log(`GraphQL endpoint: ${process.env.API_URL}${server.graphqlPath}`);
        });
      }
    } else {
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`GraphQL endpoint: http://localhost:${PORT}${server.graphqlPath}`);
      });
    }
  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
}

startServer().catch(console.error); 