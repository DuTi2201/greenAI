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
exports.exportWeeklyReport = exports.sendWeeklyReportEmail = exports.getWeeklyReport = void 0;
const date_fns_1 = require("date-fns");
const locale_1 = require("date-fns/locale");
const report_service_1 = __importDefault(require("../services/report.service"));
const email_service_1 = __importDefault(require("../services/email.service"));
const getWeeklyReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ message: 'Không có quyền truy cập' });
        }
        const date = req.query.date ? new Date(req.query.date) : new Date();
        const stats = yield report_service_1.default.generateWeeklyStats(date);
        res.json(stats);
    }
    catch (error) {
        console.error('Lỗi khi lấy báo cáo:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});
exports.getWeeklyReport = getWeeklyReport;
const sendWeeklyReportEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const userEmail = (_b = req.user) === null || _b === void 0 ? void 0 : _b.email;
        if (!userId || !userEmail) {
            return res.status(401).json({ message: 'Không có quyền truy cập hoặc thiếu email' });
        }
        const date = req.body.date ? new Date(req.body.date) : new Date();
        const stats = yield report_service_1.default.generateWeeklyStats(date);
        yield email_service_1.default.sendWeeklyReport(userEmail, stats);
        res.json({ message: 'Đã gửi báo cáo qua email thành công' });
    }
    catch (error) {
        console.error('Lỗi khi gửi email báo cáo:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});
exports.sendWeeklyReportEmail = sendWeeklyReportEmail;
const exportWeeklyReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ message: 'Không có quyền truy cập' });
        }
        const startDate = req.query.startDate ? new Date(req.query.startDate) : (0, date_fns_1.startOfWeek)(new Date());
        const endDate = req.query.endDate ? new Date(req.query.endDate) : (0, date_fns_1.endOfWeek)(new Date());
        const stats = yield report_service_1.default.generateWeeklyStats(startDate);
        const pdfBuffer = yield report_service_1.default.generatePDF(stats);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=bao-cao-${(0, date_fns_1.format)(startDate, 'dd-MM-yyyy', { locale: locale_1.vi })}.pdf`);
        res.send(pdfBuffer);
    }
    catch (error) {
        console.error('Lỗi khi xuất PDF:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});
exports.exportWeeklyReport = exportWeeklyReport;
