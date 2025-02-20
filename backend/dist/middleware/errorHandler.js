"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const logger_1 = require("../utils/logger");
const errorHandler = (err, req, res, next) => {
    logger_1.logger.error('Error:', err);
    // Kiểm tra loại lỗi và trả về response phù hợp
    if (err.name === 'ValidationError') {
        res.status(400).json({
            error: 'Dữ liệu không hợp lệ',
            details: err.message
        });
        return;
    }
    if (err.name === 'UnauthorizedError') {
        res.status(401).json({
            error: 'Không có quyền truy cập'
        });
        return;
    }
    // Lỗi mặc định
    res.status(500).json({
        error: 'Lỗi server',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
};
exports.errorHandler = errorHandler;
