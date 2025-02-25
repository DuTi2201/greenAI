"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const server_1 = require("../server");
const error_1 = require("./error");
const protect = async (req, _res, next) => {
    try {
        let token;
        if (req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            return next(new error_1.AppError('You are not logged in. Please log in to get access.', 401));
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await server_1.prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                fullName: true
            }
        });
        if (!user) {
            return next(new error_1.AppError('The user belonging to this token no longer exists.', 401));
        }
        req.user = user;
        next();
    }
    catch (error) {
        next(new error_1.AppError('Invalid token. Please log in again.', 401));
    }
};
exports.protect = protect;
//# sourceMappingURL=auth.js.map