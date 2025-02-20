import nodemailer from 'nodemailer';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { WeeklyStats } from '../types/report.types';
import { AlertData } from '../types/alert.types';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendWeeklyReport(to: string, data: WeeklyStats) {
    const html = this.generateWeeklyReportTemplate(data);
    
    await this.transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject: `Báo cáo tuần ${format(data.startDate, 'dd/MM/yyyy', { locale: vi })} - ${format(data.endDate, 'dd/MM/yyyy', { locale: vi })}`,
      html,
    });
  }

  async sendAlert(to: string, data: AlertData) {
    const html = this.generateAlertTemplate(data);
    
    await this.transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject: `[${data.type.toUpperCase()}] ${data.title}`,
      html,
    });
  }

  private generateWeeklyReportTemplate(data: WeeklyStats): string {
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
              <h1>Báo cáo tuần ${format(data.startDate, 'dd/MM/yyyy', { locale: vi })} - ${format(data.endDate, 'dd/MM/yyyy', { locale: vi })}</h1>
            </div>
            <!-- Các phần nội dung báo cáo -->
          </div>
        </body>
      </html>
    `;
  }

  private generateAlertTemplate(data: AlertData): string {
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
            <p>Thời gian: ${format(data.timestamp, 'HH:mm:ss dd/MM/yyyy', { locale: vi })}</p>
          </div>
        </body>
      </html>
    `;
  }
}

export default new EmailService(); 