"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const alert_controller_1 = require("../controllers/alert.controller");
const router = (0, express_1.Router)();
// Áp dụng middleware xác thực cho tất cả các routes
router.use(auth_middleware_1.authenticateToken);
// GET /api/alerts - Lấy danh sách thông báo
router.get('/', alert_controller_1.getAlerts);
// POST /api/alerts - Tạo thông báo mới
router.post('/', alert_controller_1.createAlert);
// PUT /api/alerts/:id/status - Cập nhật trạng thái thông báo
router.put('/:id/status', alert_controller_1.updateAlertStatus);
// PUT /api/alerts/mark-all-read - Đánh dấu tất cả thông báo là đã đọc
router.put('/mark-all-read', alert_controller_1.markAllAsRead);
exports.default = router;
