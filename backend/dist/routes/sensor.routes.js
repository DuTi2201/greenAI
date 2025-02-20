"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const sensor_controller_1 = require("../controllers/sensor.controller");
const router = (0, express_1.Router)();
// Áp dụng middleware xác thực cho tất cả các routes
router.use(auth_middleware_1.authenticateToken);
router.get('/', sensor_controller_1.getSensorData);
router.get('/latest', sensor_controller_1.getLatestSensorData);
router.post('/', sensor_controller_1.createSensorData);
exports.default = router;
