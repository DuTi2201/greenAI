import express from 'express';
import { protect } from '../../middleware/auth';
import { db } from '../../singleton';
import { AppError } from '../../middleware/error';
import { z } from 'zod';
import { validateRequest } from '../../middleware/validate';
import { automationService } from '../../services/automation.service';
import { apiLimiter } from '../../middleware/rate-limit';

const router = express.Router();

// Validate automation rule schema
const automationRuleSchema = z.object({
  name: z.string().optional(),
  sensorType: z.enum(['temperature', 'humidity', 'soilMoisture', 'lightLevel', 'schedule']),
  conditionOperator: z.enum(['>', '<', '=', '>=', '<=', 'time']),
  thresholdValue: z.number(),
  actionDevice: z.enum(['fan', 'led', 'nutrientPump', 'waterPump']),
  actionStatus: z.boolean(),
  priority: z.number().min(0).max(10).default(0),
  delayTime: z.number().min(300).max(86400).default(300), // Tối thiểu 5 phút, tối đa 24 giờ
  isActive: z.boolean().default(true),
  scheduleTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(), // HH:MM format
  scheduleType: z.enum(['once', 'daily', 'weekly']).optional(),
  scheduleDay: z.number().min(0).max(6).optional(), // 0-6, 0 là Chủ nhật
  scheduleDate: z.string().optional(), // ISO date string
});

// Protect all routes
router.use(protect);
router.use(apiLimiter);

// Get automation rules for a garden
router.get('/rules/:gardenId', async (req, res, next) => {
  try {
    // Validate garden ownership
    const garden = await db.garden.findFirst({
      where: {
        id: req.params.gardenId,
        userId: req.user!.id
      }
    });

    if (!garden) {
      return next(new AppError('Không tìm thấy vườn', 404));
    }

    const rules = await db.automationRule.findMany({
      where: {
        gardenId: garden.id
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    res.json({
      status: 'success',
      data: { rules }
    });
  } catch (error) {
    next(error);
  }
});

// Check rule conflicts
router.get('/rules/:gardenId/conflicts', async (req, res, next) => {
  try {
    // Validate garden ownership
    const garden = await db.garden.findFirst({
      where: {
        id: req.params.gardenId,
        userId: req.user!.id
      }
    });

    if (!garden) {
      return next(new AppError('Không tìm thấy vườn', 404));
    }

    const rules = await db.automationRule.findMany({
      where: {
        gardenId: garden.id,
        isActive: true
      }
    });

    const conflicts = automationService.checkRuleConflicts(rules);

    res.json({
      status: 'success',
      data: { 
        conflicts,
        hasConflicts: conflicts.length > 0
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create automation rule
router.post('/rules', validateRequest(z.object({ body: automationRuleSchema.extend({ gardenId: z.string() }) })), async (req, res, next) => {
  try {
    const {
      gardenId,
      name,
      sensorType,
      conditionOperator,
      thresholdValue,
      actionDevice,
      actionStatus,
      priority,
      delayTime,
      isActive,
      scheduleTime,
      scheduleType,
      scheduleDay,
      scheduleDate
    } = req.body;

    // Validate garden ownership
    const garden = await db.garden.findFirst({
      where: {
        id: gardenId,
        userId: req.user!.id
      }
    });

    if (!garden) {
      return next(new AppError('Không tìm thấy vườn', 404));
    }

    // Check if maximum rules limit reached (10 rules per garden)
    const rulesCount = await db.automationRule.count({
      where: { gardenId }
    });

    if (rulesCount >= 10) {
      return next(new AppError('Đã đạt giới hạn tối đa (10) quy tắc cho vườn này', 400));
    }

    // Kiểm tra các trường bắt buộc cho quy tắc lập lịch
    if (sensorType === 'schedule') {
      if (!scheduleTime || !scheduleType) {
        return next(new AppError('Thời gian và loại lịch là bắt buộc cho quy tắc lập lịch', 400));
      }

      if (scheduleType === 'weekly' && scheduleDay === undefined) {
        return next(new AppError('Ngày trong tuần là bắt buộc cho lịch hàng tuần', 400));
      }

      if (scheduleType === 'once' && !scheduleDate) {
        return next(new AppError('Ngày cụ thể là bắt buộc cho lịch một lần', 400));
      }
    }

    // Kiểm tra xung đột với các quy tắc hiện có
    const existingRules = await db.automationRule.findMany({
      where: {
        gardenId,
        isActive: true,
        sensorType: { not: 'schedule' } // Chỉ kiểm tra xung đột cho quy tắc cảm biến
      }
    });

    // Chỉ kiểm tra xung đột nếu không phải quy tắc lập lịch
    if (sensorType !== 'schedule') {
      const newRule = {
        id: 'temp-id', // ID tạm thời cho việc kiểm tra xung đột
        gardenId,
        name,
        sensorType,
        conditionOperator,
        thresholdValue,
        actionDevice,
        actionStatus,
        priority: priority || 0,
        delayTime: delayTime || 300,
        isActive: isActive !== undefined ? isActive : true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const conflicts = automationService.checkRuleConflicts([...existingRules, newRule as any]);

      // Nếu có xung đột, cảnh báo người dùng
      if (conflicts.length > 0) {
        // Lọc ra các xung đột liên quan đến quy tắc mới
        const newRuleConflicts = conflicts.filter(
          conflict => conflict.rule1.id === 'temp-id' || conflict.rule2.id === 'temp-id'
        );

        if (newRuleConflicts.length > 0) {
          return res.status(200).json({
            status: 'warning',
            message: 'Quy tắc mới có thể xung đột với các quy tắc hiện có',
            data: {
              conflicts: newRuleConflicts,
              rule: null
            }
          });
        }
      }
    }

    // Chuẩn bị dữ liệu để tạo quy tắc
    const ruleData: any = {
      gardenId,
      name,
      sensorType,
      conditionOperator,
      thresholdValue,
      actionDevice,
      actionStatus,
      priority: priority || 0,
      delayTime: delayTime || 300,
      isActive: isActive !== undefined ? isActive : true
    };

    // Thêm các trường lập lịch nếu cần
    if (sensorType === 'schedule') {
      ruleData.scheduleTime = scheduleTime;
      ruleData.scheduleType = scheduleType;
      
      if (scheduleType === 'weekly') {
        ruleData.scheduleDay = scheduleDay;
      }
      
      if (scheduleType === 'once' && scheduleDate) {
        ruleData.scheduleDate = new Date(scheduleDate);
      }
    }

    // Tạo quy tắc mới
    const rule = await db.automationRule.create({
      data: ruleData
    });

    // Nếu là quy tắc lập lịch, lập lịch cho nó
    if (sensorType === 'schedule' && rule.isActive) {
      await automationService.scheduleAutomationRule(rule);
    }

    res.status(201).json({
      status: 'success',
      data: { rule }
    });
  } catch (error) {
    next(error);
  }
});

// Update automation rule
router.put('/rules/:id', validateRequest(z.object({ body: automationRuleSchema.partial() })), async (req, res, next) => {
  try {
    const ruleId = req.params.id;
    
    // Find the rule first to check ownership
    const existingRule = await db.automationRule.findUnique({
      where: { id: ruleId },
      include: { garden: true }
    });

    if (!existingRule) {
      return next(new AppError('Không tìm thấy quy tắc', 404));
    }

    // Check if user owns the garden
    if (existingRule.garden.userId !== req.user!.id) {
      return next(new AppError('Không có quyền truy cập', 403));
    }

    // Kiểm tra các trường bắt buộc cho quy tắc lập lịch
    if (req.body.sensorType === 'schedule') {
      if (!req.body.scheduleTime || !req.body.scheduleType) {
        return next(new AppError('Thời gian và loại lịch là bắt buộc cho quy tắc lập lịch', 400));
      }

      if (req.body.scheduleType === 'weekly' && req.body.scheduleDay === undefined) {
        return next(new AppError('Ngày trong tuần là bắt buộc cho lịch hàng tuần', 400));
      }

      if (req.body.scheduleType === 'once' && !req.body.scheduleDate) {
        return next(new AppError('Ngày cụ thể là bắt buộc cho lịch một lần', 400));
      }
    }

    // Kiểm tra xung đột nếu cập nhật các trường liên quan đến điều kiện và không phải quy tắc lập lịch
    if ((req.body.sensorType && req.body.sensorType !== 'schedule') || 
        (existingRule.sensorType !== 'schedule' && 
         (req.body.conditionOperator || req.body.thresholdValue || req.body.actionDevice || req.body.actionStatus))) {
      
      const otherRules = await db.automationRule.findMany({
        where: {
          gardenId: existingRule.gardenId,
          isActive: true,
          id: { not: ruleId },
          sensorType: { not: 'schedule' }
        }
      });

      const updatedRule = {
        ...existingRule,
        ...req.body
      };

      const conflicts = automationService.checkRuleConflicts([...otherRules, updatedRule]);

      // Nếu có xung đột, cảnh báo người dùng
      if (conflicts.length > 0) {
        // Lọc ra các xung đột liên quan đến quy tắc đang cập nhật
        const updatedRuleConflicts = conflicts.filter(
          conflict => conflict.rule1.id === ruleId || conflict.rule2.id === ruleId
        );

        if (updatedRuleConflicts.length > 0) {
          return res.status(200).json({
            status: 'warning',
            message: 'Quy tắc cập nhật có thể xung đột với các quy tắc hiện có',
            data: {
              conflicts: updatedRuleConflicts,
              rule: null
            }
          });
        }
      }
    }

    // Chuẩn bị dữ liệu cập nhật
    const updateData: any = { ...req.body };
    
    // Xử lý trường scheduleDate nếu có
    if (updateData.scheduleDate) {
      updateData.scheduleDate = new Date(updateData.scheduleDate);
    }

    // Cập nhật quy tắc
    const rule = await db.automationRule.update({
      where: { id: ruleId },
      data: updateData
    });

    // Nếu là quy tắc lập lịch và đang active, cập nhật lịch
    if (rule.sensorType === 'schedule' && rule.isActive) {
      await automationService.scheduleAutomationRule(rule);
    }
    // Nếu quy tắc bị vô hiệu hóa, hủy lịch
    else if (rule.sensorType === 'schedule' && !rule.isActive) {
      await automationService.cancelScheduledRule(rule.id);
    }

    res.json({
      status: 'success',
      data: { rule }
    });
  } catch (error) {
    next(error);
  }
});

// Delete automation rule
router.delete('/rules/:id', async (req, res, next) => {
  try {
    const ruleId = req.params.id;
    
    // Find the rule first to check ownership
    const existingRule = await db.automationRule.findUnique({
      where: { id: ruleId },
      include: { garden: true }
    });

    if (!existingRule) {
      return next(new AppError('Không tìm thấy quy tắc', 404));
    }

    // Check if user owns the garden
    if (existingRule.garden.userId !== req.user!.id) {
      return next(new AppError('Không có quyền truy cập', 403));
    }

    await db.automationRule.delete({
      where: { id: ruleId }
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Initialize scheduled rules when server starts
automationService.initializeScheduledRules();

export default router; 