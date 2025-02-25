import { httpServer, app, io } from './app';
import { config } from 'dotenv';
import { db } from './singleton';

// Load environment variables
config();

const PORT = process.env.PORT || 3001;

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Database: ${process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'Not configured'}`);
  console.log(`Redis: ${process.env.REDIS_URL?.split('@')[1] || process.env.REDIS_URL || 'Not configured'}`);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  
  // Close server & exit process
  httpServer.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Export prisma client for testing
export { db as prisma, app, io }; 