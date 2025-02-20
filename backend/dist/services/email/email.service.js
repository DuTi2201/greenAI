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
exports.emailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const date_fns_1 = require("date-fns");
const locale_1 = require("date-fns/locale");
const weekly_report_1 = require("./templates/weekly-report");
const alert_1 = require("./templates/alert");
class EmailService {
    constructor() {
        this.transporter = nodemailer_1.default.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    sendWeeklyReport(to, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const subject = `Báo cáo tuần ${(0, date_fns_1.format)(data.startDate, 'dd/MM/yyyy', { locale: locale_1.vi })} - ${(0, date_fns_1.format)(data.endDate, 'dd/MM/yyyy', { locale: locale_1.vi })}`;
            const html = (0, weekly_report_1.generateWeeklyReportTemplate)(data);
            yield this.transporter.sendMail({
                from: process.env.SMTP_FROM,
                to,
                subject,
                html,
            });
        });
    }
    sendAlert(to, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const subject = `${data.type === 'error' ? '🚨' : data.type === 'warning' ? '⚠️' : '✅'} ${data.title}`;
            const html = (0, alert_1.generateAlertTemplate)(data);
            yield this.transporter.sendMail({
                from: process.env.SMTP_FROM,
                to,
                subject,
                html,
            });
        });
    }
    verifyConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.transporter.verify();
                return true;
            }
            catch (error) {
                console.error('Email service verification failed:', error);
                return false;
            }
        });
    }
}
exports.emailService = new EmailService();
