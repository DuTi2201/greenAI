import express from 'express';
import { protect } from '../../middleware/auth';
import { db } from '../../singleton';
import { AppError } from '../../middleware/error';
import { z } from 'zod';
import { validateRequest } from '../../middleware/validate';
import { apiLimiter } from '../../middleware/rate-limit';
import { analyzeGardenData, predictSensorTrends, getGardenAlerts, markAlertAsRead, resolveAlert } from '../../services/ai.service';
import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { aiService } from '../../services/ai.service';
import { prisma } from '../../prisma';

const router = express.Router();

// Protect all routes
router.use(protect);
router.use(apiLimiter);

// Middleware kiểm tra quyền sở hữu vườn
const checkGardenOwnership = async (req: any, res: any, next: any) => {
  try {
    const { gardenId } = req.params;
    
    if (!gardenId) {
      return next(new AppError('Garden ID không được cung cấp', 400));
    }
    
    const garden = await db.garden.findUnique({
      where: { id: gardenId },
      select: { userId: true }
    });
    
    if (!garden) {
      return next(new AppError('Không tìm thấy vườn với ID đã cung cấp', 404));
    }
    
    if (garden.userId !== req.user?.id) {
      return next(new AppError('Bạn không có quyền truy cập vào vườn này', 403));
    }
    
    next();
  } catch (error) {
    next(new AppError('Lỗi khi kiểm tra quyền sở hữu vườn', 500));
  }
};

// Phân tích dữ liệu vườn
router.post('/analyze', validateRequest(z.object({
  body: z.object({
    gardenId: z.string(),
    timeRange: z.object({
      start: z.string().transform(val => new Date(val)),
      end: z.string().transform(val => new Date(val))
    }),
    reportType: z.enum(['growth', 'efficiency', 'issues', 'weekly'])
  })
})), async (req, res, next) => {
  try {
    const { gardenId, timeRange, reportType } = req.body;
    
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
    if (timeRange.start >= timeRange.end) {
      return next(new AppError('Thời gian bắt đầu phải trước thời gian kết thúc', 400));
    }

    // Lấy dữ liệu cảm biến
    const sensorData = await db.sensorData.findMany({
      where: {
        gardenId,
        recordedAt: {
          gte: timeRange.start,
          lte: timeRange.end
        }
      },
      orderBy: { recordedAt: 'asc' }
    });

    // Lấy dữ liệu trạng thái thiết bị
    const deviceStatus = await db.deviceStatus.findMany({
      where: {
        gardenId,
        updatedAt: {
          gte: timeRange.start,
          lte: timeRange.end
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
        analysisPeriodStart: timeRange.start,
        analysisPeriodEnd: timeRange.end,
        geminiModelVersion: 'gemini-pro',
        status: 'processing',
        reportFormat: 'JSON'
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
        startDate: timeRange.start,
        endDate: timeRange.end
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

// Dự đoán xu hướng
router.post('/predict', validateRequest(z.object({
  body: z.object({
    gardenId: z.string(),
    predictionHorizon: z.number().min(1).max(30).default(7)
  })
})), async (req, res, next) => {
  try {
    const { gardenId, predictionHorizon } = req.body;
    
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

    try {
      const predictions = await predictSensorTrends(gardenId, predictionHorizon);
      
      res.json({
        status: 'success',
        data: { predictions }
      });
    } catch (error) {
      return next(new AppError(error instanceof Error ? error.message : 'Lỗi dự đoán', 400));
    }
  } catch (error) {
    next(error);
  }
});

// Lấy danh sách cảnh báo
router.get('/alerts/:gardenId', async (req, res, next) => {
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

    const alerts = await getGardenAlerts(gardenId);
    
    res.json({
      status: 'success',
      data: { alerts }
    });
  } catch (error) {
    next(error);
  }
});

// Đánh dấu cảnh báo đã đọc
router.patch('/alerts/:alertId/read', async (req, res, next) => {
  try {
    const { alertId } = req.params;
    
    // Verify alert ownership
    const alert = await db.aIAlert.findUnique({
      where: { id: alertId },
      include: { garden: true }
    });

    if (!alert) {
      return next(new AppError('Không tìm thấy cảnh báo', 404));
    }

    if (alert.garden.userId !== req.user!.id) {
      return next(new AppError('Không có quyền truy cập', 403));
    }

    await markAlertAsRead(alertId);
    
    res.json({
      status: 'success',
      message: 'Đã đánh dấu cảnh báo là đã đọc'
    });
  } catch (error) {
    next(error);
  }
});

// Đánh dấu cảnh báo đã giải quyết
router.patch('/alerts/:alertId/resolve', async (req, res, next) => {
  try {
    const { alertId } = req.params;
    
    // Verify alert ownership
    const alert = await db.aIAlert.findUnique({
      where: { id: alertId },
      include: { garden: true }
    });

    if (!alert) {
      return next(new AppError('Không tìm thấy cảnh báo', 404));
    }

    if (alert.garden.userId !== req.user!.id) {
      return next(new AppError('Không có quyền truy cập', 403));
    }

    await resolveAlert(alertId);
    
    res.json({
      status: 'success',
      message: 'Đã đánh dấu cảnh báo là đã giải quyết'
    });
  } catch (error) {
    next(error);
  }
});

// Lấy báo cáo
router.get('/reports/:gardenId', async (req, res, next) => {
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

// Lấy báo cáo cụ thể
router.get('/reports/:reportId/detail', async (req, res, next) => {
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

const aiRouter = Router();

// Phân tích dữ liệu vườn
aiRouter.post(
  '/analyze/:gardenId',
  [
    param('gardenId').isUUID().withMessage('Garden ID không hợp lệ'),
    body('timeRange.start').isISO8601().withMessage('Thời gian bắt đầu không hợp lệ'),
    body('timeRange.end').isISO8601().withMessage('Thời gian kết thúc không hợp lệ'),
    body('reportType').isString().withMessage('Loại báo cáo không hợp lệ'),
  ],
  validateRequest,
  checkGardenOwnership,
  async (req, res) => {
    try {
      const { gardenId } = req.params;
      const { timeRange, reportType } = req.body;

      const report = await aiService.analyzeGardenData(gardenId, {
        timeRange: {
          start: new Date(timeRange.start),
          end: new Date(timeRange.end),
        },
        reportType,
      });

      res.status(200).json({
        success: true,
        data: {
          reportId: report.id,
          status: report.status,
          message: 'Báo cáo đang được tạo',
        },
      });
    } catch (error) {
      console.error('Error analyzing garden data:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi phân tích dữ liệu vườn',
        error: error.message,
      });
    }
  }
);

// Dự đoán xu hướng
aiRouter.post(
  '/predict/:gardenId',
  [
    param('gardenId').isUUID().withMessage('Garden ID không hợp lệ'),
    body('predictionHorizon').isInt({ min: 1, max: 30 }).withMessage('Khoảng thời gian dự đoán phải từ 1-30 ngày'),
  ],
  validateRequest,
  checkGardenOwnership,
  async (req, res) => {
    try {
      const { gardenId } = req.params;
      const { predictionHorizon } = req.body;

      const predictions = await aiService.predictSensorTrends(gardenId, predictionHorizon);

      res.status(200).json({
        success: true,
        data: {
          predictions,
        },
      });
    } catch (error) {
      console.error('Error predicting sensor trends:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi dự đoán xu hướng cảm biến',
        error: error.message,
      });
    }
  }
);

// Lấy danh sách báo cáo
aiRouter.get(
  '/reports/:gardenId',
  [param('gardenId').isUUID().withMessage('Garden ID không hợp lệ')],
  validateRequest,
  checkGardenOwnership,
  async (req, res) => {
    try {
      const { gardenId } = req.params;

      const reports = await prisma.aIReport.findMany({
        where: {
          gardenId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      res.status(200).json({
        success: true,
        data: {
          reports,
        },
      });
    } catch (error) {
      console.error('Error fetching reports:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách báo cáo',
        error: error.message,
      });
    }
  }
);

// Tải báo cáo
aiRouter.get(
  '/reports/:gardenId/download',
  [
    param('gardenId').isUUID().withMessage('Garden ID không hợp lệ'),
    query('type').isString().withMessage('Loại báo cáo không hợp lệ'),
  ],
  validateRequest,
  checkGardenOwnership,
  async (req, res) => {
    try {
      const { gardenId } = req.params;
      const { type } = req.query;

      // Tìm báo cáo mới nhất của loại đã chọn
      const report = await prisma.aIReport.findFirst({
        where: {
          gardenId,
          reportType: type as string,
          status: 'completed',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy báo cáo',
        });
      }

      // Trong thực tế, bạn sẽ tạo PDF từ dữ liệu báo cáo
      // Ở đây chúng ta giả lập bằng cách trả về JSON
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=garden_report_${type}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      // Giả lập PDF bằng cách trả về dữ liệu JSON
      const pdfData = Buffer.from(JSON.stringify(report.result, null, 2));
      res.send(pdfData);
    } catch (error) {
      console.error('Error downloading report:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tải báo cáo',
        error: error.message,
      });
    }
  }
);

// Lấy danh sách cảnh báo
aiRouter.get(
  '/alerts/:gardenId',
  [param('gardenId').isUUID().withMessage('Garden ID không hợp lệ')],
  validateRequest,
  checkGardenOwnership,
  async (req, res) => {
    try {
      const { gardenId } = req.params;

      const alerts = await prisma.aIAlert.findMany({
        where: {
          gardenId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      res.status(200).json({
        success: true,
        data: {
          alerts,
        },
      });
    } catch (error) {
      console.error('Error fetching alerts:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách cảnh báo',
        error: error.message,
      });
    }
  }
);

// Đánh dấu cảnh báo đã đọc
aiRouter.put(
  '/alerts/:alertId/read',
  [param('alertId').isUUID().withMessage('Alert ID không hợp lệ')],
  validateRequest,
  async (req, res) => {
    try {
      const { alertId } = req.params;
      const userId = req.user.id;

      // Kiểm tra quyền sở hữu cảnh báo
      const alert = await prisma.aIAlert.findUnique({
        where: { id: alertId },
        include: {
          garden: true,
        },
      });

      if (!alert) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy cảnh báo',
        });
      }

      if (alert.garden.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền truy cập cảnh báo này',
        });
      }

      // Cập nhật trạng thái đã đọc
      const updatedAlert = await prisma.aIAlert.update({
        where: { id: alertId },
        data: { isRead: true },
      });

      res.status(200).json({
        success: true,
        data: {
          alert: updatedAlert,
        },
      });
    } catch (error) {
      console.error('Error marking alert as read:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi đánh dấu cảnh báo đã đọc',
        error: error.message,
      });
    }
  }
);

// Giải quyết cảnh báo
aiRouter.put(
  '/alerts/:alertId/resolve',
  [param('alertId').isUUID().withMessage('Alert ID không hợp lệ')],
  validateRequest,
  async (req, res) => {
    try {
      const { alertId } = req.params;
      const userId = req.user.id;

      // Kiểm tra quyền sở hữu cảnh báo
      const alert = await prisma.aIAlert.findUnique({
        where: { id: alertId },
        include: {
          garden: true,
        },
      });

      if (!alert) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy cảnh báo',
        });
      }

      if (alert.garden.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền truy cập cảnh báo này',
        });
      }

      // Cập nhật trạng thái đã giải quyết
      const updatedAlert = await prisma.aIAlert.update({
        where: { id: alertId },
        data: { 
          isResolved: true,
          isRead: true 
        },
      });

      res.status(200).json({
        success: true,
        data: {
          alert: updatedAlert,
        },
      });
    } catch (error) {
      console.error('Error resolving alert:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi giải quyết cảnh báo',
        error: error.message,
      });
    }
  }
);

export { aiRouter }; 