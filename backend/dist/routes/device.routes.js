"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const device_controller_1 = require("../controllers/device.controller");
const router = (0, express_1.Router)();
// Áp dụng middleware xác thực cho tất cả các routes
router.use(auth_middleware_1.authenticateToken);
// Routes không yêu cầu quyền admin
router.get('/', device_controller_1.getAllDevices);
router.get('/:id', device_controller_1.getDeviceById);
router.post('/:id/control', device_controller_1.controlDevice); // Cho phép user thường điều khiển thiết bị
// Routes yêu cầu quyền admin
router.post('/', (0, auth_middleware_1.authorize)(['admin']), device_controller_1.createDevice);
router.put('/:id', (0, auth_middleware_1.authorize)(['admin']), device_controller_1.updateDevice);
router.delete('/:id', (0, auth_middleware_1.authorize)(['admin']), device_controller_1.deleteDevice);
exports.default = router;
