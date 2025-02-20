import dotenv from 'dotenv';
dotenv.config();

import express, { RequestHandler } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import routes from './routes';
import sequelize from './config/database';
import reportRoutes from './routes/report.routes';
import { errorHandler } from './middleware/errorHandler';
import { connectDB } from './config/database';
import { logger } from './utils/logger';
import { authenticateToken } from './middleware/auth.middleware';

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Allow-Headers',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
    'Access-Control-Allow-Origin'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

// Options pre-flight
app.options('*', cors());

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'GreenAI API Server' });
});

// Áp dụng middleware xác thực cho tất cả API routes
app.use('/api', authenticateToken as RequestHandler, routes);
app.use('/api/reports', authenticateToken as RequestHandler, reportRoutes);

// WebSocket handlers
io.on('connection', (socket) => {
  logger.info('Client connected');

  socket.on('sensor_data', (data) => {
    // Broadcast sensor data to all connected clients
    io.emit('sensor_update', data);
  });

  socket.on('disconnect', () => {
    logger.info('Client disconnected');
  });
});

// Error handling
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5005;

// Khởi tạo database và khởi động server
async function startServer() {
  try {
    // Kết nối database
    await connectDB();
    console.log('Đã kết nối thành công đến database.');

    // Đồng bộ model với database
    await sequelize.sync();
    console.log('Đã đồng bộ model với database.');

    // Khởi động server
    httpServer.listen(PORT, () => {
      console.log(`Server đang chạy trên cổng ${PORT}`);
      console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    });
  } catch (error: any) {
    console.error('Lỗi khi khởi động server:', error);
    process.exit(1);
  }
}

startServer();

export { io }; 