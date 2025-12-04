require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const path = require('path');
const connectDB = require('./config/db');
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');
const { socketAuth } = require('./middleware/auth');
const { initializeSocket } = require('./socket/socketHandlers');
const { Channel } = require('./models');

// Initialize Express
const app = express();
const server = http.createServer(app);

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://eric-chat-app.vercel.app',
    process.env.CLIENT_URL,
  ].filter(Boolean),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api', routes);

// Error Handler (must be last)
app.use(errorHandler);

// Initialize Socket.io
const io = new Server(server, {
  cors: corsOptions,
});

// Socket authentication middleware
io.use(socketAuth);

// Initialize socket handlers
initializeSocket(io);

// Database connection and server start
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Ensure default channel exists
    const generalChannel = await Channel.findOne({ name: 'general' });
    if (!generalChannel) {
      await Channel.create({ name: 'general', description: 'General discussion' });
      console.log('Created default #general channel');
    }

    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Socket.io ready for connections`);
      console.log(`🔗 API available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});
