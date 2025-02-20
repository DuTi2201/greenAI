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
exports.markAllAsRead = exports.createAlert = exports.updateAlertStatus = exports.getAlerts = void 0;
const Alert_1 = __importDefault(require("../models/Alert"));
const Device_1 = __importDefault(require("../models/Device"));
const getAlerts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const alerts = yield Alert_1.default.findAll({
            order: [['created_at', 'DESC']],
            limit: 50, // Giới hạn 50 thông báo gần nhất
        });
        res.json(alerts);
    }
    catch (error) {
        console.error('Error fetching alerts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getAlerts = getAlerts;
const updateAlertStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const alert = yield Alert_1.default.findByPk(id);
        if (!alert) {
            res.status(404).json({ error: 'Alert not found' });
            return;
        }
        yield alert.update({
            status,
            resolvedAt: status === 'resolved' ? new Date() : undefined,
        });
        res.json(alert);
    }
    catch (error) {
        console.error('Error updating alert status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.updateAlertStatus = updateAlertStatus;
const createAlert = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type, message, severity, deviceId, metadata } = req.body;
        const device = yield Device_1.default.findByPk(deviceId);
        if (!device) {
            res.status(404).json({ message: 'Device not found' });
            return;
        }
        const alert = yield Alert_1.default.create({
            type,
            message,
            severity,
            deviceId,
            status: 'active',
            metadata,
        });
        res.status(201).json(alert);
    }
    catch (error) {
        console.error('Error creating alert:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.createAlert = createAlert;
const markAllAsRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield Alert_1.default.update({
            status: 'resolved',
            resolvedAt: new Date(),
        }, {
            where: {
                status: 'active',
            },
        });
        res.json({ message: 'All alerts marked as resolved' });
    }
    catch (error) {
        console.error('Error marking all alerts as read:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.markAllAsRead = markAllAsRead;
