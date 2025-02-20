"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const wemos_controller_1 = require("../controllers/wemos.controller");
const wemos_validator_1 = require("../middleware/wemos.validator");
const router = express_1.default.Router();
const wemosController = new wemos_controller_1.WemosController();
// Nhận dữ liệu cảm biến từ Wemos
router.post('/data', wemos_validator_1.WemosValidator.validateSensorData, wemosController.receiveSensorData);
// Trả về lệnh điều khiển cho Wemos
router.get('/control', wemosController.getControlCommands);
// Cập nhật cấu hình ngưỡng
router.post('/config', wemos_validator_1.WemosValidator.validateConfig, wemosController.updateConfig);
exports.default = router;
