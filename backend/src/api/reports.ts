import express from 'express';
import { db } from '../singleton';
import { protect } from '../middleware/auth';
import { analyzeGardenData } from '../services/ai.service';

const router = express.Router();

// Lấy lịch sử dữ liệu cảm biến
router.get('/:deviceId/history', protect, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { startDate, endDate } = req.query;

    // Kiểm tra thiết bị tồn tại và thuộc về user
    const garden = await db.garden.findFirst({
      where: {
        id: deviceId,
        userId: req.user!.id
      }
    });

    if (!garden) {
      return res.status(404).json({
        status: 'error',
        message: 'Device not found'
      });
    }

    // Validate dates
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 ngày trước
    const end = endDate ? new Date(endDate as string) : new Date();

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid date format'
      });
    }

    // Lấy dữ liệu cảm biến
    const sensorData = await db.sensorData.findMany({
      where: {
        gardenId: deviceId,
        recordedAt: {
          gte: start,
          lte: end
        }
      },
      orderBy: {
        recordedAt: 'asc'
      }
    });

    // Lấy trạng thái thiết bị
    const deviceStatus = await db.deviceStatus.findMany({
      where: {
        gardenId: deviceId,
        updatedAt: {
          gte: start,
          lte: end
        }
      },
      orderBy: {
        updatedAt: 'asc'
      }
    });

    res.json({
      status: 'success',
      data: {
        sensorData,
        deviceStatus
      }
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Phân tích dữ liệu bằng AI
router.post('/:deviceId/analyze', protect, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { startDate, endDate, analysisType } = req.body;

    if (!analysisType) {
      return res.status(400).json({
        status: 'error',
        message: 'Analysis type is required'
      });
    }

    // Kiểm tra thiết bị tồn tại và thuộc về user
    const garden = await db.garden.findFirst({
      where: {
        id: deviceId,
        userId: req.user!.id
      }
    });

    if (!garden) {
      return res.status(404).json({
        status: 'error',
        message: 'Device not found'
      });
    }

    // Validate dates
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 ngày trước
    const end = endDate ? new Date(endDate) : new Date();

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid date format'
      });
    }

    // Lấy dữ liệu để phân tích
    const sensorData = await db.sensorData.findMany({
      where: {
        gardenId: deviceId,
        recordedAt: {
          gte: start,
          lte: end
        }
      },
      orderBy: {
        recordedAt: 'asc'
      }
    });

    const deviceStatus = await db.deviceStatus.findMany({
      where: {
        gardenId: deviceId,
        updatedAt: {
          gte: start,
          lte: end
        }
      },
      orderBy: {
        updatedAt: 'asc'
      }
    });

    // Phân tích dữ liệu
    const analysis = await analyzeGardenData({
      garden,
      sensorData,
      deviceStatus,
      analysisType,
      startDate: start,
      endDate: end
    });

    // Lưu kết quả phân tích
    const aiAnalysis = await db.aIAnalysis.create({
      data: {
        gardenId: deviceId,
        analysisType,
        result: analysis
      }
    });

    res.json({
      status: 'success',
      data: {
        analysis: aiAnalysis
      }
    });
  } catch (error) {
    console.error('Analyze data error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Lấy danh sách phân tích AI
router.get('/:deviceId/analysis', protect, async (req, res) => {
  try {
    const { deviceId } = req.params;

    // Kiểm tra thiết bị tồn tại và thuộc về user
    const garden = await db.garden.findFirst({
      where: {
        id: deviceId,
        userId: req.user!.id
      }
    });

    if (!garden) {
      return res.status(404).json({
        status: 'error',
        message: 'Device not found'
      });
    }

    // Lấy danh sách phân tích
    const analyses = await db.aIAnalysis.findMany({
      where: {
        gardenId: deviceId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      status: 'success',
      data: {
        analyses
      }
    });
  } catch (error) {
    console.error('Get analyses error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

export default router; 