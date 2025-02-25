"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.SMTP_USER || 'your-email@gmail.com',
        pass: process.env.SMTP_PASS || 'your-app-specific-password'
    }
});
const sendEmail = async (options) => {
    try {
        await transporter.sendMail({
            from: process.env.SMTP_USER || 'your-email@gmail.com',
            to: options.to,
            subject: options.subject,
            html: options.html
        });
    }
    catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send email');
    }
};
exports.sendEmail = sendEmail;
//# sourceMappingURL=email.js.map