import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from 'dotenv';
import { errorHandler } from './middleware/error';
import { setupWebSocket } from './lib/websocket';
import { setupBullQueues } from './lib/queue';
import { initializeScheduler } from './services/scheduler.service';
import helmet from 'helmet';
import compression from 'compression';
import { apiLimiter } from './middleware/rate-limit';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { csrfProtection, handleCSRFError, generateCSRFToken } from './middleware/csrf';

// Routes
import authRouter from './api/routes/auth';
import deviceRouter from './api/routes/devices';
import sensorRouter from './api/routes/sensors';
import automationRouter from './api/routes/automation';
import reportRouter from './api/routes/reports';
import gardenRouter from './api/routes/gardens';
import plantRouter from './api/routes/plants';
import logRouter from './api/routes/logs';
import { aiRouter } from './api/routes/ai';

// Load environment variables
config();

// Create Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
export const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Xử lý lỗi CSRF
app.use(handleCSRFError);

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
app.use('/api', apiLimiter);

// CSRF protection cho các routes không phải API
app.use('/api/auth/login', csrfProtection, generateCSRFToken);
app.use('/api/auth/register', csrfProtection, generateCSRFToken);
app.use('/api/auth/reset-password', csrfProtection, generateCSRFToken);

// Routes
app.use('/api/auth', authRouter);
app.use('/api/devices', deviceRouter);
app.use('/api/sensors', sensorRouter);
app.use('/api/automation', automationRouter);
app.use('/api/reports', reportRouter);
app.use('/api/gardens', gardenRouter);
app.use('/api/plants', plantRouter);
app.use('/api/logs', logRouter);
app.use('/api/ai', aiRouter);

// Error handling
app.use(errorHandler);

// Setup WebSocket handlers
setupWebSocket(io);

// Setup Bull queues
setupBullQueues();

// Initialize scheduler only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  initializeScheduler().catch(console.error);
}

export { app, httpServer }; 