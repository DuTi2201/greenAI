import express from 'express';
import { protect } from '../../middleware/auth';
import { db } from '../../singleton';
import { AppError } from '../../middleware/error';
import { z } from 'zod';
import { validateRequest } from '../../middleware/validate';
import { apiLimiter } from '../../middleware/rate-limit';
import { analyzeGardenData } from '../../services/ai.service';
import { pdfService } from '../../services/pdf.service';
import { emailService } from '../../services/email.service';
import path from 'path';
import fs from 'fs';
import { Prisma } from '@prisma/client';

const router = express.Router();

// Protect all routes
router.use(protect);
router.use(apiLimiter);

// Get all reports for a garden
router.get('/garden/:gardenId', async (req, res, next) => {
  try {
    const { gardenId } = req.params;
    
    // Verify garden ownership
    const garden = await db.garden.findFirst({
      where: {
        id: gardenId,
        userId: req.user!.id
      }
    });

    if (!garden) {
      return next(new AppError('Không tìm thấy vườn', 404));
    }

    // Get reports
    const reports = await db.aIReport.findMany({
      where: { gardenId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      status: 'success',
      data: { reports }
    });
  } catch (error) {
    next(error);
  }
});

// Get a specific report
router.get('/:reportId', async (req, res, next) => {
  try {
    const { reportId } = req.params;
    
    // Get report
    const report = await db.aIReport.findUnique({
      where: { id: reportId },
      include: { garden: true }
    }) as any;

    if (!report) {
      return next(new AppError('Không tìm thấy báo cáo', 404));
    }

    // Verify ownership
    if (report.garden.userId !== req.user!.id) {
      return next(new AppError('Không có quyền truy cập', 403));
    }

    res.json({
      status: 'success',
      data: { report }
    });
  } catch (error) {
    next(error);
  }
});

// Generate a new report
router.post('/generate', validateRequest(z.object({
  body: z.object({
    gardenId: z.string(),
    reportType: z.enum(['growth', 'efficiency', 'issues', 'weekly']),
    startDate: z.string().transform(val => new Date(val)),
    endDate: z.string().transform(val => new Date(val)),
    reportFormat: z.enum(['PDF', 'HTML', 'JSON']).default('JSON')
  })
})), async (req, res, next) => {
  try {
    const { gardenId, reportType, startDate, endDate, reportFormat } = req.body;
    
    // Verify garden ownership
    const garden = await db.garden.findFirst({
      where: {
        id: gardenId,
        userId: req.user!.id
      }
    });

    if (!garden) {
      return next(new AppError('Không tìm thấy vườn', 404));
    }

    // Kiểm tra thời gian phân tích
    if (startDate >= endDate) {
      return next(new AppError('Ngày bắt đầu phải trước ngày kết thúc', 400));
    }

    // Lấy dữ liệu cảm biến
    const sensorData = await db.sensorData.findMany({
      where: {
        gardenId,
        recordedAt: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { recordedAt: 'asc' }
    });

    // Lấy dữ liệu trạng thái thiết bị
    const deviceStatus = await db.deviceStatus.findMany({
      where: {
        gardenId,
        updatedAt: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { updatedAt: 'asc' }
    });

    // Kiểm tra dữ liệu
    if (sensorData.length === 0) {
      return next(new AppError('Không có dữ liệu cảm biến trong khoảng thời gian này', 400));
    }

    // Tạo báo cáo đang xử lý
    const pendingReport = await db.aIReport.create({
      data: {
        gardenId,
        reportType,
        result: {},
        analysisPeriodStart: startDate,
        analysisPeriodEnd: endDate,
        geminiModelVersion: 'gemini-pro',
        status: 'processing',
        reportFormat
      }
    });

    // Xử lý bất đồng bộ
    res.status(202).json({
      status: 'success',
      message: 'Báo cáo đang được tạo',
      data: { reportId: pendingReport.id }
    });

    // Phân tích dữ liệu (bất đồng bộ)
    try {
      const result = await analyzeGardenData({
        garden: {
          ...garden,
          location: garden.location || undefined,
          description: garden.description || undefined,
          lastConnected: garden.lastConnected || undefined,
          deviceType: garden.deviceType || undefined,
          firmwareVersion: garden.firmwareVersion || undefined
        },
        sensorData: sensorData.map(data => ({
          id: data.id,
          gardenId: data.gardenId,
          temperature: Number(data.temperature),
          humidity: Number(data.humidity),
          soilMoisture: Number(data.soilMoisture),
          lightLevel: Number(data.lightLevel),
          recordedAt: data.recordedAt
        })),
        deviceStatus,
        analysisType: reportType,
        startDate,
        endDate
      });

      // Cập nhật báo cáo
      const updatedReport = await db.aIReport.update({
        where: { id: pendingReport.id },
        data: {
          result,
          status: 'completed'
        }
      });
      
      // Tạo file PDF nếu định dạng là PDF
      if (reportFormat === 'PDF') {
        try {
          const filename = `report_${garden.id}_${reportType}_${new Date().getTime()}.pdf`;
          const pdfPath = await pdfService.generateReportPdf(
            {
              garden,
              sensorData,
              deviceStatus,
              reportType,
              startDate,
              endDate,
              result
            },
            {
              title: `Báo cáo ${pdfService.getReportTypeName(reportType)} - ${garden.name}`,
              filename
            }
          );
          
          // Lưu đường dẫn PDF vào báo cáo
          await db.$executeRaw`
            UPDATE "AIReport"
            SET "pdfPath" = ${path.basename(pdfPath)}
            WHERE id = ${updatedReport.id}
          `;
        } catch (pdfError) {
          console.error('Failed to generate PDF:', pdfError);
        }
      }
    } catch (error) {
      // Cập nhật báo cáo lỗi
      await db.aIReport.update({
        where: { id: pendingReport.id },
        data: {
          result: { error: error instanceof Error ? error.message : 'Unknown error' },
          status: 'failed'
        }
      });

      console.error('Failed to generate report:', error);
    }
  } catch (error) {
    next(error);
  }
});

// Download report as PDF
router.get('/:reportId/download', async (req, res, next) => {
  try {
    const { reportId } = req.params;
    
    // Get report
    const report = await db.aIReport.findUnique({
      where: { id: reportId },
      include: { garden: true }
    }) as any;

    if (!report) {
      return next(new AppError('Không tìm thấy báo cáo', 404));
    }

    // Verify ownership
    if (report.garden.userId !== req.user!.id) {
      return next(new AppError('Không có quyền truy cập', 403));
    }
    
    // Kiểm tra trạng thái báo cáo
    if (report.status !== 'completed') {
      return next(new AppError('Báo cáo chưa hoàn thành', 400));
    }
    
    // Kiểm tra xem đã có file PDF chưa
    let pdfPath = '';
    
    // Sử dụng any để tránh lỗi TypeScript
    const reportAny = report as any;
    
    if (reportAny.pdfPath) {
      // Sử dụng file PDF đã tạo
      pdfPath = path.join(process.cwd(), 'reports', reportAny.pdfPath);
      
      if (!fs.existsSync(pdfPath)) {
        // Nếu file không tồn tại, tạo mới
        pdfPath = await pdfService.generatePdfFromReport(report, report.garden);
      }
    } else {
      // Tạo file PDF mới
      pdfPath = await pdfService.generatePdfFromReport(report, report.garden);
      
      // Lưu đường dẫn PDF vào báo cáo
      await db.$executeRaw`
        UPDATE "AIReport"
        SET "pdfPath" = ${path.basename(pdfPath)}
        WHERE id = ${report.id}
      `;
    }
    
    // Gửi file PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${path.basename(pdfPath)}`);
    
    const fileStream = fs.createReadStream(pdfPath);
    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
});

// Send report via email
router.post('/:reportId/email', validateRequest(z.object({
  body: z.object({
    email: z.string().email(),
  })
})), async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const { email } = req.body;
    
    // Get report
    const report = await db.aIReport.findUnique({
      where: { id: reportId },
      include: { garden: true }
    });

    if (!report) {
      return next(new AppError('Không tìm thấy báo cáo', 404));
    }

    // Verify ownership
    if (report.garden.userId !== req.user!.id) {
      return next(new AppError('Không có quyền truy cập', 403));
    }
    
    // Kiểm tra trạng thái báo cáo
    if (report.status !== 'completed') {
      return next(new AppError('Báo cáo chưa hoàn thành', 400));
    }
    
    // Kiểm tra xem đã có file PDF chưa
    let pdfPath = '';
    
    // Sử dụng any để tránh lỗi TypeScript
    const reportAny = report as any;
    
    if (reportAny.pdfPath) {
      // Sử dụng file PDF đã tạo
      pdfPath = path.join(process.cwd(), 'reports', reportAny.pdfPath);
      
      if (!fs.existsSync(pdfPath)) {
        // Nếu file không tồn tại, tạo mới
        pdfPath = await pdfService.generatePdfFromReport(report, report.garden);
      }
    } else {
      // Tạo file PDF mới
      pdfPath = await pdfService.generatePdfFromReport(report, report.garden);
      
      // Lưu đường dẫn PDF vào báo cáo
      await db.$executeRaw`
        UPDATE "AIReport"
        SET "pdfPath" = ${path.basename(pdfPath)}
        WHERE id = ${report.id}
      `;
    }
    
    // Gửi email với file PDF đính kèm
    const emailSent = await emailService.sendReportEmail(
      email,
      report.garden,
      report.reportType,
      pdfPath,
      report.analysisPeriodStart,
      report.analysisPeriodEnd
    );
    
    if (emailSent) {
      res.json({
        status: 'success',
        message: 'Email đã được gửi thành công'
      });
    } else {
      return next(new AppError('Không thể gửi email', 500));
    }
  } catch (error) {
    next(error);
  }
});

// Get all report schedules for a garden
router.get('/garden/:gardenId/schedules', async (req, res, next) => {
  try {
    const { gardenId } = req.params;
    
    // Verify garden ownership
    const garden = await db.garden.findFirst({
      where: {
        id: gardenId,
        userId: req.user!.id
      }
    });

    if (!garden) {
      return next(new AppError('Không tìm thấy vườn', 404));
    }

    // Get schedules
    const schedules = await db.reportSchedule.findMany({
      where: { gardenId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      status: 'success',
      data: { schedules }
    });
  } catch (error) {
    next(error);
  }
});

// Get schedule status
router.get('/schedules/:scheduleId/status', async (req, res, next) => {
  try {
    const { scheduleId } = req.params;
    
    // Get schedule
    const schedule = await db.reportSchedule.findUnique({
      where: { id: scheduleId },
      include: { garden: true }
    });

    if (!schedule) {
      return next(new AppError('Không tìm thấy lịch trình', 404));
    }

    // Verify ownership
    if (schedule.userId !== req.user!.id) {
      return next(new AppError('Không có quyền truy cập', 403));
    }
    
    // Lấy báo cáo gần nhất được tạo bởi lịch trình này
    const latestReport = await db.aIReport.findFirst({
      where: {
        gardenId: schedule.gardenId,
        reportType: schedule.reportType,
        createdAt: {
          gte: schedule.lastSent || new Date(0)
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Tính toán thời gian chạy tiếp theo
    let nextRun = schedule.nextScheduledSend;
    if (!nextRun) {
      // Tính toán thời gian chạy tiếp theo dựa trên tần suất
      nextRun = new Date();
      const timeOfDay = new Date(schedule.timeOfDay);
      
      nextRun.setHours(timeOfDay.getHours());
      nextRun.setMinutes(timeOfDay.getMinutes());
      nextRun.setSeconds(0);
      nextRun.setMilliseconds(0);
      
      switch (schedule.frequency) {
        case 'daily':
          // Nếu thời gian đã qua, đặt vào ngày mai
          if (nextRun < new Date()) {
            nextRun.setDate(nextRun.getDate() + 1);
          }
          break;
          
        case 'weekly':
          // Đặt vào ngày trong tuần
          const currentDay = nextRun.getDay();
          const targetDay = schedule.dayOfWeek || 0;
          const daysToAdd = (targetDay - currentDay + 7) % 7;
          
          nextRun.setDate(nextRun.getDate() + daysToAdd);
          
          // Nếu là cùng ngày và thời gian đã qua, đặt vào tuần sau
          if (daysToAdd === 0 && nextRun < new Date()) {
            nextRun.setDate(nextRun.getDate() + 7);
          }
          break;
          
        case 'monthly':
          // Đặt vào ngày đầu tiên của tháng
          nextRun.setDate(1);
          
          // Nếu thời gian đã qua, đặt vào tháng sau
          if (nextRun < new Date()) {
            nextRun.setMonth(nextRun.getMonth() + 1);
          }
          break;
      }
    }
    
    res.json({
      status: 'success',
      data: {
        schedule,
        lastReport: latestReport,
        nextRun
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create a new report schedule
router.post('/garden/:gardenId/schedules', validateRequest(z.object({
  body: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly']),
    dayOfWeek: z.number().min(0).max(6).optional(),
    timeOfDay: z.string(),
    emailRecipients: z.array(z.string().email()),
    reportType: z.enum(['growth', 'efficiency', 'issues', 'weekly']),
    isActive: z.boolean().default(true)
  })
})), async (req, res, next) => {
  try {
    const { gardenId } = req.params;
    const { frequency, dayOfWeek, timeOfDay, emailRecipients, reportType, isActive } = req.body;
    
    // Verify garden ownership
    const garden = await db.garden.findFirst({
      where: {
        id: gardenId,
        userId: req.user!.id
      }
    });

    if (!garden) {
      return next(new AppError('Không tìm thấy vườn', 404));
    }
    
    // Kiểm tra tính hợp lệ của lịch trình
    if (frequency === 'weekly' && (dayOfWeek === undefined || dayOfWeek < 0 || dayOfWeek > 6)) {
      return next(new AppError('Ngày trong tuần không hợp lệ', 400));
    }
    
    // Tạo lịch trình báo cáo mới
    const schedule = await db.reportSchedule.create({
      data: {
        gardenId,
        userId: req.user!.id,
        frequency,
        dayOfWeek,
        timeOfDay: new Date(timeOfDay),
        emailRecipient: emailRecipients,
        reportType,
        isActive
      }
    });

    res.status(201).json({
      status: 'success',
      data: { schedule }
    });
  } catch (error) {
    next(error);
  }
});

// Update a report schedule
router.patch('/schedules/:scheduleId', validateRequest(z.object({
  body: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
    dayOfWeek: z.number().min(0).max(6).optional(),
    timeOfDay: z.string().optional(),
    emailRecipients: z.array(z.string().email()).optional(),
    reportType: z.enum(['growth', 'efficiency', 'issues', 'weekly']).optional(),
    isActive: z.boolean().optional()
  })
})), async (req, res, next) => {
  try {
    const { scheduleId } = req.params;
    const updateData = req.body;
    
    // Get schedule
    const schedule = await db.reportSchedule.findUnique({
      where: { id: scheduleId },
      include: { garden: true }
    });

    if (!schedule) {
      return next(new AppError('Không tìm thấy lịch trình', 404));
    }

    // Verify ownership
    if (schedule.userId !== req.user!.id) {
      return next(new AppError('Không có quyền truy cập', 403));
    }
    
    // Cập nhật timeOfDay nếu có
    if (updateData.timeOfDay) {
      updateData.timeOfDay = new Date(updateData.timeOfDay);
    }
    
    // Cập nhật lịch trình
    const updatedSchedule = await db.reportSchedule.update({
      where: { id: scheduleId },
      data: updateData
    });

    res.json({
      status: 'success',
      data: { schedule: updatedSchedule }
    });
  } catch (error) {
    next(error);
  }
});

// Delete a report schedule
router.delete('/schedules/:scheduleId', async (req, res, next) => {
  try {
    const { scheduleId } = req.params;
    
    // Get schedule
    const schedule = await db.reportSchedule.findUnique({
      where: { id: scheduleId }
    });

    if (!schedule) {
      return next(new AppError('Không tìm thấy lịch trình', 404));
    }

    // Verify ownership
    if (schedule.userId !== req.user!.id) {
      return next(new AppError('Không có quyền truy cập', 403));
    }
    
    // Xóa lịch trình
    await db.reportSchedule.delete({
      where: { id: scheduleId }
    });

    res.json({
      status: 'success',
      message: 'Lịch trình đã được xóa'
    });
  } catch (error) {
    next(error);
  }
});

export default router; 