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
exports.authorize = exports.authenticateToken = exports.PUBLIC_ROUTES = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const logger_1 = require("../utils/logger");
// Lấy JWT_SECRET từ biến môi trường
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
}
// Danh sách các route không cần xác thực
exports.PUBLIC_ROUTES = ['/api/auth/login', '/api/auth/register', '/'];
const authenticateToken = (req, res, next) => {
    try {
        if (exports.PUBLIC_ROUTES.includes(req.path)) {
            return next();
        }
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Không tìm thấy token xác thực' });
        }
        jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, decoded) => __awaiter(void 0, void 0, void 0, function* () {
            if (err) {
                return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
            }
            try {
                const payload = decoded;
                const user = yield User_1.User.findByPk(payload.id);
                if (!user) {
                    return res.status(401).json({ message: 'Người dùng không tồn tại' });
                }
                req.user = {
                    id: payload.id,
                    email: payload.email,
                    role: user.role // Lấy role từ database thay vì từ token
                };
                next();
            }
            catch (error) {
                logger_1.logger.error('Error in authenticateToken:', error);
                return res.status(500).json({ message: 'Lỗi server' });
            }
        }));
    }
    catch (error) {
        logger_1.logger.error('Error in authenticateToken:', error);
        return res.status(500).json({ message: 'Lỗi server' });
    }
};
exports.authenticateToken = authenticateToken;
const authorize = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Không có quyền truy cập' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Không đủ quyền để thực hiện thao tác này' });
        }
        next();
    };
};
exports.authorize = authorize;
