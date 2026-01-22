/**
 * Main server file for the Chat App backend
 * Sets up Express server, middleware, and routes
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const db = require('./config/database');
const { initDatabase } = require('./models/initDb');

// Initialize database tables
initDatabase();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3001',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: 'http://localhost:3001', // Frontend URL
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messageRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

// Root route - API information
app.get('/', (req, res) => {
  res.json({
    message: 'Chat App API Server',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me (requires Authorization header)'
      },
      users: {
        search: 'GET /api/users/search?username= (requires Authorization header)'
      },
      chats: {
        createPrivate: 'POST /api/chats/private (requires Authorization header)',
        getAll: 'GET /api/chats (requires Authorization header)'
      },
      messages: {
        getMessages: 'GET /api/messages/:chatId (requires Authorization header)',
        sendMessage: 'POST /api/messages/:chatId (requires Authorization header)'
      },
      socket: {
        connection: 'WebSocket connection available',
        events: ['join_chat', 'send_message', 'typing_start', 'typing_stop']
      }
    },
    documentation: 'See PHASE1_MANUAL_TESTING.md for API documentation'
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/upload', uploadRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Handle multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large. Maximum size is 5MB' });
    }
    return res.status(400).json({ error: err.message });
  }
  
  // Handle other errors
  if (err.message) {
    return res.status(400).json({ error: err.message });
  }
  
  res.status(500).json({ error: 'Something went wrong!' });
});

// Socket.IO setup
const { initializeSocket } = require('./config/socket');
initializeSocket(io);

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Socket.IO server initialized`);
});

