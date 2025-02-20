import nodemailer from 'nodemailer';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { generateWeeklyReportTemplate } from './templates/weekly-report';
import { generateAlertTemplate } from './templates/alert';

interface WeeklyReportData {
  startDate: Date;
  endDate: Date;
  energyUsage: {
    total: number;
    byDevice: {
      deviceId: string;
      deviceName: string;
      powerUsage: number;
      hoursActive: number;
    }[];
    previousWeek: number;
    prediction: number;
  };
  waterUsage: {
    total: number;
    byPump: {
      pumpId: string;
      pumpName: string;
      liters: number;
      hoursActive: number;
    }[];
    previousWeek: number;
    prediction: number;
  };
  sensorStats: {
    sensorId: string;
    sensorName: string;
    uptime: number;
    readings: number;
    accuracy: number;
  }[];
  recommendations: {
    title: string;
    description: string;
    savings: {
      energy?: number;
      water?: number;
    };
  }[];
}

interface AlertData {
  type: 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  deviceId?: string;
  deviceName?: string;
  sensorData?: {
    temperature?: number;
    humidity?: number;
    soilMoisture?: number;
    light?: number;
  };
}

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

  async sendWeeklyReport(to: string, data: WeeklyReportData): Promise<void> {
    const subject = `Báo cáo tuần ${format(data.startDate, 'dd/MM/yyyy', { locale: vi })} - ${format(data.endDate, 'dd/MM/yyyy', { locale: vi })}`;
    const html = generateWeeklyReportTemplate(data);

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
    });
  }

  async sendAlert(to: string, data: AlertData): Promise<void> {
    const subject = `${data.type === 'error' ? '🚨' : data.type === 'warning' ? '⚠️' : '✅'} ${data.title}`;
    const html = generateAlertTemplate(data);

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
    });
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email service verification failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService(); 