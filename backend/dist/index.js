"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const routes_1 = __importDefault(require("./routes"));
const database_1 = __importDefault(require("./config/database"));
const report_routes_1 = __importDefault(require("./routes/report.routes"));
const errorHandler_1 = require("./middleware/errorHandler");
const database_2 = require("./config/database");
const logger_1 = require("./utils/logger");
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
// Middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// CORS middleware
app.use((0, cors_1.default)({
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
app.options('*', (0, cors_1.default)());
// Socket.IO setup
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
});
exports.io = io;
// Base route
app.get('/', (req, res) => {
    res.json({ message: 'GreenAI API Server' });
});
// API routes
app.use('/api', routes_1.default);
app.use('/api/reports', report_routes_1.default);
// WebSocket handlers
io.on('connection', (socket) => {
    logger_1.logger.info('Client connected');
    socket.on('sensor_data', (data) => {
        // Broadcast sensor data to all connected clients
        io.emit('sensor_update', data);
    });
    socket.on('disconnect', () => {
        logger_1.logger.info('Client disconnected');
    });
});
// Error handling
app.use(errorHandler_1.errorHandler);
// Start server
const PORT = process.env.PORT || 5000;
// Khởi tạo database và khởi động server
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Kết nối database
            yield (0, database_2.connectDB)();
            console.log('Đã kết nối thành công đến database.');
            // Đồng bộ model với database
            yield database_1.default.sync();
            console.log('Đã đồng bộ model với database.');
            // Khởi động server
            httpServer.listen(PORT, () => {
                console.log(`Server đang chạy trên cổng ${PORT}`);
                console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
            });
        }
        catch (error) {
            console.error('Lỗi khi khởi động server:', error);
            process.exit(1);
        }
    });
}
startServer();
