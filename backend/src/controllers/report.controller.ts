import { Request, Response } from 'express';
import { format, subWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { vi } from 'date-fns/locale';
import reportService from '../services/report.service';
import emailService from '../services/email.service';
import { AuthRequest } from '../types/auth.types';

export const getWeeklyReport = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Không có quyền truy cập' });
    }

    const date = req.query.date ? new Date(req.query.date as string) : new Date();
    const stats = await reportService.generateWeeklyStats(date);

    res.json(stats);
  } catch (error) {
    console.error('Lỗi khi lấy báo cáo:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const sendWeeklyReportEmail = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userEmail = req.user?.email;
    
    if (!userId || !userEmail) {
      return res.status(401).json({ message: 'Không có quyền truy cập hoặc thiếu email' });
    }

    const date = req.body.date ? new Date(req.body.date) : new Date();
    const stats = await reportService.generateWeeklyStats(date);
    
    await emailService.sendWeeklyReport(userEmail, stats);

    res.json({ message: 'Đã gửi báo cáo qua email thành công' });
  } catch (error) {
    console.error('Lỗi khi gửi email báo cáo:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const exportWeeklyReport = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Không có quyền truy cập' });
    }

    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : startOfWeek(new Date());
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : endOfWeek(new Date());
    
    const stats = await reportService.generateWeeklyStats(startDate);
    const pdfBuffer = await reportService.generatePDF(stats);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=bao-cao-${format(startDate, 'dd-MM-yyyy', { locale: vi })}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Lỗi khi xuất PDF:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}; 