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
const nodemailer_1 = __importDefault(require("nodemailer"));
const date_fns_1 = require("date-fns");
const locale_1 = require("date-fns/locale");
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
            const html = this.generateWeeklyReportTemplate(data);
            yield this.transporter.sendMail({
                from: process.env.SMTP_FROM,
                to,
                subject: `Báo cáo tuần ${(0, date_fns_1.format)(data.startDate, 'dd/MM/yyyy', { locale: locale_1.vi })} - ${(0, date_fns_1.format)(data.endDate, 'dd/MM/yyyy', { locale: locale_1.vi })}`,
                html,
            });
        });
    }
    sendAlert(to, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const html = this.generateAlertTemplate(data);
            yield this.transporter.sendMail({
                from: process.env.SMTP_FROM,
                to,
                subject: `[${data.type.toUpperCase()}] ${data.title}`,
                html,
            });
        });
    }
    generateWeeklyReportTemplate(data) {
        // Template HTML cho báo cáo tuần
        return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 20px; }
            .chart { width: 100%; height: 300px; }
            .recommendation { background: #f5f5f5; padding: 15px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Báo cáo tuần ${(0, date_fns_1.format)(data.startDate, 'dd/MM/yyyy', { locale: locale_1.vi })} - ${(0, date_fns_1.format)(data.endDate, 'dd/MM/yyyy', { locale: locale_1.vi })}</h1>
            </div>
            <!-- Các phần nội dung báo cáo -->
          </div>
        </body>
      </html>
    `;
    }
    generateAlertTemplate(data) {
        // Template HTML cho thông báo
        return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; }
            .alert { padding: 20px; border-radius: 5px; margin: 20px; }
            .warning { background: #fff3cd; border: 1px solid #ffeeba; }
            .error { background: #f8d7da; border: 1px solid #f5c6cb; }
            .success { background: #d4edda; border: 1px solid #c3e6cb; }
          </style>
        </head>
        <body>
          <div class="alert ${data.type}">
            <h2>${data.title}</h2>
            <p>${data.message}</p>
            <p>Thời gian: ${(0, date_fns_1.format)(data.timestamp, 'HH:mm:ss dd/MM/yyyy', { locale: locale_1.vi })}</p>
          </div>
        </body>
      </html>
    `;
    }
}
exports.default = new EmailService();
