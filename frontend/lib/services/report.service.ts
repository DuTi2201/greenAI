import { WeeklyStats } from '@/types/report.types';
import api from '../api';

export interface ReportData {
  weekly: WeeklyStats;
  // Thêm các loại báo cáo khác ở đây nếu cần
}

class ReportService {
  async getWeeklyReport(): Promise<WeeklyStats> {
    const response = await api.get('/reports/weekly');
    return response.data;
  }

  async sendWeeklyReportEmail(): Promise<void> {
    await api.post('/reports/weekly/email');
  }

  async exportPDF(startDate: string, endDate: string): Promise<Blob> {
    const response = await api.get('/reports/export', {
      params: { startDate, endDate },
      responseType: 'blob'
    });
    return response.data;
  }
}

export const reportService = new ReportService(); 