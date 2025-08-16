"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const database_1 = require("./config/database");
const RefreshToken_1 = __importDefault(require("./models/RefreshToken"));
const File_1 = __importDefault(require("./models/File"));
const PORT = process.env.PORT || 3001;
let server;
const gracefulShutdown = (signal) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);
    if (server) {
        server.close(async (err) => {
            if (err) {
                console.error('Error during server shutdown:', err);
                process.exit(1);
            }
            console.log('HTTP server closed.');
            try {
                console.log('Cleaning up expired tokens...');
                await RefreshToken_1.default.cleanupExpiredTokens();
                console.log('Cleaning up orphaned files...');
                await File_1.default.cleanupOrphanedFiles();
                console.log('Cleanup completed.');
            }
            catch (error) {
                console.error('Error during cleanup:', error);
            }
            console.log('Graceful shutdown completed.');
            process.exit(0);
        });
    }
    else {
        process.exit(0);
    }
    setTimeout(() => {
        console.error('Forced shutdown due to timeout');
        process.exit(1);
    }, 30000);
};
const startServer = async () => {
    try {
        console.log('Testing database connection...');
        await (0, database_1.testConnection)();
        console.log('Database connection successful!');
        server = app_1.default.listen(PORT, () => {
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
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('uncaughtException', (error) => {
            console.error('Uncaught Exception:', error);
            gracefulShutdown('UNCAUGHT_EXCEPTION');
        });
        process.on('unhandledRejection', (reason, promise) => {
            console.error('Unhandled Rejection at:', promise, 'reason:', reason);
            gracefulShutdown('UNHANDLED_REJECTION');
        });
        return server;
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
const serverPromise = startServer();
exports.default = serverPromise;
if (process.env.NODE_ENV === 'production') {
    setInterval(async () => {
        try {
            console.log('Running scheduled cleanup tasks...');
            await RefreshToken_1.default.cleanupExpiredTokens();
            await File_1.default.cleanupOrphanedFiles();
            console.log('Scheduled cleanup completed.');
        }
        catch (error) {
            console.error('Error during scheduled cleanup:', error);
        }
    }, 60 * 60 * 1000);
}
//# sourceMappingURL=server.js.map