import axios from 'axios';
import { authService } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface Report {
  id: string;
  gardenId: string;
  reportType: string;
  content: string;
  analysisPeriodStart: Date;
  analysisPeriodEnd: Date;
  geminiModelVersion: string;
  createdAt: Date;
}

export interface ReportSchedule {
  id: string;
  userId: string;
  gardenId: string;
  frequency: string;
  dayOfWeek?: number;
  timeOfDay: Date;
  emailRecipient: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GenerateReportData {
  reportType: string;
  startDate: Date;
  endDate: Date;
}

export interface CreateScheduleData {
  frequency: string;
  dayOfWeek?: number;
  timeOfDay: Date;
  emailRecipient: string;
}

export interface UpdateScheduleData {
  frequency?: string;
  dayOfWeek?: number;
  timeOfDay?: Date;
  emailRecipient?: string;
  isActive?: boolean;
}

class ReportService {
  private getHeaders() {
    const token = authService.getToken();
    return {
      Authorization: `Bearer ${token}`
    };
  }

  async getReports(deviceId: string): Promise<Report[]> {
    try {
      const response = await axios.get(`${API_URL}/reports/${deviceId}`, {
        headers: this.getHeaders()
      });
      return response.data.data.reports;
    } catch (error) {
      console.warn('Get reports error:', error);
      throw error;
    }
  }

  async generateReport(deviceId: string, data: GenerateReportData): Promise<Report> {
    try {
      const response = await axios.post(`${API_URL}/reports/${deviceId}`, data, {
        headers: this.getHeaders()
      });
      return response.data.data.report;
    } catch (error) {
      console.warn('Generate report error:', error);
      throw error;
    }
  }

  async getSchedules(deviceId: string): Promise<ReportSchedule[]> {
    try {
      const response = await axios.get(`${API_URL}/reports/${deviceId}/schedules`, {
        headers: this.getHeaders()
      });
      return response.data.data.schedules;
    } catch (error) {
      console.warn('Get schedules error:', error);
      throw error;
    }
  }

  async createSchedule(deviceId: string, data: CreateScheduleData): Promise<ReportSchedule> {
    try {
      const response = await axios.post(`${API_URL}/reports/${deviceId}/schedules`, data, {
        headers: this.getHeaders()
      });
      return response.data.data.schedule;
    } catch (error) {
      console.warn('Create schedule error:', error);
      throw error;
    }
  }

  async updateSchedule(
    deviceId: string,
    scheduleId: string,
    data: UpdateScheduleData
  ): Promise<ReportSchedule> {
    try {
      const response = await axios.patch(
        `${API_URL}/reports/${deviceId}/schedules/${scheduleId}`,
        data,
        {
          headers: this.getHeaders()
        }
      );
      return response.data.data.schedule;
    } catch (error) {
      console.warn('Update schedule error:', error);
      throw error;
    }
  }

  async deleteSchedule(deviceId: string, scheduleId: string): Promise<void> {
    try {
      await axios.delete(`${API_URL}/reports/${deviceId}/schedules/${scheduleId}`, {
        headers: this.getHeaders()
      });
    } catch (error) {
      console.warn('Delete schedule error:', error);
      throw error;
    }
  }
}

export const reportService = new ReportService(); 