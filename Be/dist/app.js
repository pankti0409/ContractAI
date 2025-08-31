"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const database_1 = require("./config/database");
const errorHandler_1 = require("./middleware/errorHandler");
const auth_1 = __importDefault(require("./routes/auth"));
const admin_1 = __importDefault(require("./routes/admin"));
const app = (0, express_1.default)();
const SERVER_SESSION_ID = (0, uuid_1.v4)();
console.log(`Server session ID: ${SERVER_SESSION_ID}`);
app.use((0, helmet_1.default)({
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
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL?.split(',') || ['http://localhost:3000']
        : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count']
}));
app.use((0, compression_1.default)());
if (process.env.NODE_ENV !== 'test') {
    app.use((0, morgan_1.default)(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
app.get('/health', async (req, res) => {
    try {
        await (0, database_1.testConnection)();
        res.status(200).json({
            success: true,
            message: 'Server is healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            version: process.env.npm_package_version || '1.0.0',
            sessionId: SERVER_SESSION_ID
        });
    }
    catch (error) {
        res.status(503).json({
            success: false,
            message: 'Database connection failed',
            timestamp: new Date().toISOString(),
            sessionId: SERVER_SESSION_ID
        });
    }
});
app.get('/api/session/validate', (req, res) => {
    const clientSessionId = req.headers['x-session-id'] || req.query.sessionId;
    res.json({
        success: true,
        sessionId: SERVER_SESSION_ID,
        isValid: clientSessionId === SERVER_SESSION_ID,
        timestamp: new Date().toISOString()
    });
});
app.use('/api/auth', auth_1.default);
app.use('/api/admin', admin_1.default);
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
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.globalErrorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map