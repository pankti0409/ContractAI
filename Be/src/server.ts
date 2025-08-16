import app from './app';
import { testConnection } from './config/database';
import RefreshTokenModel from './models/RefreshToken';
import FileModel from './models/File';
import { Server } from 'http';

const PORT = process.env.PORT || 3001;
let server: Server;

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  if (server) {
    server.close(async (err: any) => {
      if (err) {
        console.error('Error during server shutdown:', err);
        process.exit(1);
      }
      
      console.log('HTTP server closed.');
      
      try {
        // Cleanup operations
        console.log('Cleaning up expired tokens...');
        await RefreshTokenModel.cleanupExpiredTokens();
        
        console.log('Cleaning up orphaned files...');
        await FileModel.cleanupOrphanedFiles();
        
        console.log('Cleanup completed.');
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
      
      console.log('Graceful shutdown completed.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 30000);
};

// Start server
const startServer = async () => {
  try {
    // Test database connection
    console.log('Testing database connection...');
    await testConnection();
    console.log('Database connection successful!');
    
    // Start HTTP server
    server = app.listen(PORT, () => {
      console.log(`\n🚀 ContractAI Backend Server`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API Base URL: http://localhost:${PORT}/api`);
      console.log(`⏰ Started at: ${new Date().toISOString()}`);
      console.log('\n📋 Available endpoints:');
      console.log('   • Authentication: /api/auth');
      console.log('   • Chats: /api/chats');
      console.log('   • Files: /api/files');
      console.log('   • Health: /health');
      console.log('\n✅ Server is ready to accept connections!\n');
    });
    
    // Handle graceful shutdown
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });
    
    return server;
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Export server for testing
const serverPromise = startServer();
export default serverPromise;

// Cleanup tasks scheduler (run every hour)
if (process.env.NODE_ENV === 'production') {
  setInterval(async () => {
    try {
      console.log('Running scheduled cleanup tasks...');
      await RefreshTokenModel.cleanupExpiredTokens();
      await FileModel.cleanupOrphanedFiles();
      console.log('Scheduled cleanup completed.');
    } catch (error) {
      console.error('Error during scheduled cleanup:', error);
    }
  }, 60 * 60 * 1000); // 1 hour
}