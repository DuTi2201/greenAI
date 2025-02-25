import express from 'express';
import { protect } from '../../middleware/auth';
import { db } from '../../singleton';
import { AppError } from '../../middleware/error';
import { z } from 'zod';
import { validateRequest } from '../../middleware/validate';
import { apiLimiter } from '../../middleware/rate-limit';
import { analyzeGardenData } from '../../services/ai.service';

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
    });

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
        garden,
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
      await db.aIReport.update({
        where: { id: pendingReport.id },
        data: {
          result,
          status: 'completed'
        }
      });
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

// Schedule a report
router.post('/schedule', validateRequest(z.object({
  body: z.object({
    gardenId: z.string(),
    frequency: z.enum(['daily', 'weekly', 'monthly']),
    dayOfWeek: z.number().min(0).max(6).optional(), // 0 = Sunday, 6 = Saturday
    timeOfDay: z.string(), // HH:MM format
    emailRecipient: z.string().email(),
    reportType: z.enum(['growth', 'efficiency', 'issues', 'weekly']),
    isActive: z.boolean().default(true)
  })
})), async (req, res, next) => {
  try {
    const { gardenId, frequency, dayOfWeek, timeOfDay, emailRecipient, reportType, isActive } = req.body;
    
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

    // Validate dayOfWeek based on frequency
    if (frequency === 'weekly' && (dayOfWeek === undefined || dayOfWeek < 0 || dayOfWeek > 6)) {
      return next(new AppError('Ngày trong tuần không hợp lệ', 400));
    }

    // Parse timeOfDay
    const [hours, minutes] = timeOfDay.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return next(new AppError('Thời gian không hợp lệ', 400));
    }

    // Create time object
    const time = new Date();
    time.setHours(hours, minutes, 0, 0);

    // Calculate next scheduled send
    const nextScheduledSend = calculateNextScheduledSend(frequency, dayOfWeek, time);

    // Create schedule
    const schedule = await db.reportSchedule.create({
      data: {
        userId: req.user!.id,
        gardenId,
        frequency,
        dayOfWeek,
        timeOfDay: time,
        emailRecipient,
        reportType,
        isActive,
        nextScheduledSend
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

// Helper function to calculate next scheduled send
function calculateNextScheduledSend(frequency: string, dayOfWeek: number | undefined, time: Date): Date {
  const now = new Date();
  const result = new Date(now);
  
  result.setHours(time.getHours(), time.getMinutes(), 0, 0);
  
  if (result <= now) {
    // If the time today has already passed, start from tomorrow
    result.setDate(result.getDate() + 1);
  }
  
  if (frequency === 'weekly' && dayOfWeek !== undefined) {
    // Set to the next occurrence of the specified day of week
    const currentDay = result.getDay();
    const daysToAdd = (dayOfWeek - currentDay + 7) % 7;
    
    if (daysToAdd > 0 || (daysToAdd === 0 && result <= now)) {
      result.setDate(result.getDate() + daysToAdd);
    }
  } else if (frequency === 'monthly') {
    // Set to the same day next month
    result.setMonth(result.getMonth() + 1);
  }
  
  return result;
}

export default router; 