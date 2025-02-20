"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const report_controller_1 = require("../controllers/report.controller");
const router = (0, express_1.Router)();
// Áp dụng middleware xác thực cho tất cả các routes
router.use(auth_middleware_1.authenticateToken);
// Routes cho báo cáo
router.get('/weekly', report_controller_1.getWeeklyReport);
router.post('/weekly/email', report_controller_1.sendWeeklyReportEmail);
router.get('/export', report_controller_1.exportWeeklyReport);
exports.default = router;
