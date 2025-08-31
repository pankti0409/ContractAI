import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { testConnection } from './config/database';
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler';

// Import routes
import authRoutes from './routes/auth';
// import chatRoutes from './routes/chats'; // Temporarily disabled to isolate admin functionality
// import fileRoutes from './routes/files'; // Temporarily disabled due to TypeScript errors
import adminRoutes from './routes/admin';

const app = express();

// Generate unique server session ID on startup
const SERVER_SESSION_ID = uuidv4();
console.log(`Server session ID: ${SERVER_SESSION_ID}`);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL?.split(',') || ['http://localhost:3000']
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
}));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files middleware
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await testConnection();
    res.status(200).json({
      success: true,
      message: 'Server is healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      sessionId: SERVER_SESSION_ID
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Database connection failed',
      timestamp: new Date().toISOString(),
      sessionId: SERVER_SESSION_ID
    });
  }
});

// Server session validation endpoint
app.get('/api/session/validate', (req, res) => {
  const clientSessionId = req.headers['x-session-id'] || req.query.sessionId;
  
  res.json({
    success: true,
    sessionId: SERVER_SESSION_ID,
    isValid: clientSessionId === SERVER_SESSION_ID,
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
// app.use('/api/chats', chatRoutes); // Temporarily disabled to isolate admin functionality
// app.use('/api/files', fileRoutes); // Temporarily disabled due to TypeScript errors
app.use('/api/admin', adminRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'ContractAI Backend API',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      chats: '/api/chats',
      files: '/api/files',
      admin: '/api/admin',
      health: '/health'
    }
  });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(globalErrorHandler);

export default app;