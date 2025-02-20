"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const advisor_controller_1 = require("../controllers/advisor/advisor.controller");
const history_controller_1 = require("../controllers/advisor/history.controller");
const router = (0, express_1.Router)();
// Áp dụng middleware xác thực cho tất cả các routes
router.use(auth_middleware_1.authenticateToken);
router.post('/analyze', advisor_controller_1.analyzeGardenData);
router.get('/history', history_controller_1.getAdvisorHistory);
exports.default = router;
