import express from 'express';
import { db } from '../singleton';
import { protect } from '../middleware/auth';
import { validateCronExpression } from '../utils/validation';
import { scheduleJob, cancelJob } from '../services/scheduler.service';

const router = express.Router();

// Lấy danh sách lịch của một thiết bị
router.get('/:deviceId', protect, async (req, res) => {
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

    // Lấy danh sách lịch
    const schedules = await db.schedule.findMany({
      where: {
        gardenId: deviceId
      }
    });

    res.json({
      status: 'success',
      data: {
        schedules
      }
    });
  } catch (error) {
    console.error('Get schedules error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Tạo lịch mới
router.post('/:deviceId', protect, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { deviceType, actionStatus, cronExpression } = req.body;

    if (!deviceType || actionStatus === undefined || !cronExpression) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields'
      });
    }

    // Validate cron expression
    if (!validateCronExpression(cronExpression)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid cron expression'
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

    // Tạo lịch mới
    const schedule = await db.schedule.create({
      data: {
        gardenId: deviceId,
        deviceType,
        actionStatus,
        cronExpression,
        isActive: true
      }
    });

    // Đăng ký job với scheduler
    await scheduleJob(schedule);

    res.status(201).json({
      status: 'success',
      data: {
        schedule
      }
    });
  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Cập nhật lịch
router.patch('/:deviceId/schedules/:scheduleId', protect, async (req, res) => {
  try {
    const { deviceId, scheduleId } = req.params;
    const { deviceType, actionStatus, cronExpression, isActive } = req.body;

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

    // Kiểm tra lịch tồn tại
    const existingSchedule = await db.schedule.findFirst({
      where: {
        id: scheduleId,
        gardenId: deviceId
      }
    });

    if (!existingSchedule) {
      return res.status(404).json({
        status: 'error',
        message: 'Schedule not found'
      });
    }

    // Validate cron expression nếu được cập nhật
    if (cronExpression && !validateCronExpression(cronExpression)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid cron expression'
      });
    }

    // Cập nhật lịch
    const schedule = await db.schedule.update({
      where: {
        id: scheduleId
      },
      data: {
        deviceType: deviceType || undefined,
        actionStatus: actionStatus !== undefined ? actionStatus : undefined,
        cronExpression: cronExpression || undefined,
        isActive: isActive !== undefined ? isActive : undefined
      }
    });

    // Cập nhật job với scheduler
    if (schedule.isActive) {
      await scheduleJob(schedule);
    } else {
      await cancelJob(schedule.id);
    }

    res.json({
      status: 'success',
      data: {
        schedule
      }
    });
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Xóa lịch
router.delete('/:deviceId/schedules/:scheduleId', protect, async (req, res) => {
  try {
    const { deviceId, scheduleId } = req.params;

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

    // Kiểm tra lịch tồn tại
    const schedule = await db.schedule.findFirst({
      where: {
        id: scheduleId,
        gardenId: deviceId
      }
    });

    if (!schedule) {
      return res.status(404).json({
        status: 'error',
        message: 'Schedule not found'
      });
    }

    // Xóa lịch
    await db.schedule.delete({
      where: {
        id: scheduleId
      }
    });

    // Hủy job với scheduler
    await cancelJob(scheduleId);

    res.status(204).send();
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

export default router; 