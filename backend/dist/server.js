"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const client_1 = require("@prisma/client");
const dotenv_1 = require("dotenv");
const auth_1 = require("./api/routes/auth");
const devices_1 = require("./api/routes/devices");
const sensors_1 = require("./api/routes/sensors");
const automation_1 = require("./api/routes/automation");
const reports_1 = require("./api/routes/reports");
const error_1 = require("./middleware/error");
const websocket_1 = require("./lib/websocket");
const queue_1 = require("./lib/queue");
(0, dotenv_1.config)();
exports.app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(exports.app);
exports.prisma = new client_1.PrismaClient();
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
});
exports.app.use((0, cors_1.default)());
exports.app.use(express_1.default.json());
exports.app.use(express_1.default.urlencoded({ extended: true }));
exports.app.use('/api/auth', auth_1.router);
exports.app.use('/api/devices', devices_1.router);
exports.app.use('/api/sensors', sensors_1.router);
exports.app.use('/api/automation', automation_1.router);
exports.app.use('/api/reports', reports_1.router);
exports.app.use(error_1.errorHandler);
(0, websocket_1.setupWebSocket)(io);
(0, queue_1.setupBullQueues)();
if (process.env.NODE_ENV !== 'test') {
    const PORT = process.env.PORT || 3001;
    httpServer.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
//# sourceMappingURL=server.js.map