import { db } from '../singleton';
import { deviceService } from './device.service';
import { AutomationRule } from '@prisma/client';
import { Redis } from 'ioredis';
import cron from 'node-cron';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Lưu trữ các jobs đang chạy
const scheduledJobs: { [key: string]: cron.ScheduledTask } = {};

interface SensorData {
  temperature: number;
  humidity: number;
  soilMoisture: number;
  lightLevel: number;
}

/**
 * Kiểm tra điều kiện của quy tắc tự động hóa
 * @param rule Quy tắc cần kiểm tra
 * @param sensorData Dữ liệu cảm biến hiện tại
 * @returns true nếu điều kiện thỏa mãn, false nếu không
 */
const checkRuleCondition = (rule: AutomationRule, sensorData: SensorData): boolean => {
  let sensorValue: number;
  
  // Lấy giá trị cảm biến tương ứng
  switch (rule.sensorType) {
    case 'temperature':
      sensorValue = sensorData.temperature;
      break;
    case 'humidity':
      sensorValue = sensorData.humidity;
      break;
    case 'soilMoisture':
      sensorValue = sensorData.soilMoisture;
      break;
    case 'lightLevel':
      sensorValue = sensorData.lightLevel;
      break;
    default:
      return false;
  }
  
  // Kiểm tra điều kiện
  switch (rule.conditionOperator) {
    case '>':
      return sensorValue > rule.thresholdValue;
    case '<':
      return sensorValue < rule.thresholdValue;
    case '=':
      return sensorValue === rule.thresholdValue;
    case '>=':
      return sensorValue >= rule.thresholdValue;
    case '<=':
      return sensorValue <= rule.thresholdValue;
    default:
      return false;
  }
};

/**
 * Kiểm tra xem quy tắc có thể thực hiện không (kiểm tra delay)
 * @param ruleId ID của quy tắc
 * @returns true nếu có thể thực hiện, false nếu không
 */
const canExecuteRule = async (ruleId: string): Promise<boolean> => {
  const key = `rule_execution:${ruleId}`;
  const lastExecution = await redis.get(key);
  
  if (lastExecution) {
    return false; // Quy tắc đã được thực hiện gần đây
  }
  
  return true;
};

/**
 * Đánh dấu quy tắc đã được thực hiện
 * @param rule Quy tắc đã thực hiện
 */
const markRuleExecuted = async (rule: AutomationRule): Promise<void> => {
  const key = `rule_execution:${rule.id}`;
  await redis.set(key, 'executed');
  await redis.expire(key, rule.delayTime); // Set thời gian hết hạn bằng delayTime
};

/**
 * Tạo cron expression từ thông tin lịch
 * @param scheduleTime Thời gian (HH:MM)
 * @param scheduleType Loại lịch (once, daily, weekly)
 * @param scheduleDay Ngày trong tuần (0-6, 0 là Chủ nhật)
 * @param scheduleDate Ngày cụ thể (cho lịch một lần)
 * @returns Cron expression
 */
const createCronExpression = (
  scheduleTime: string,
  scheduleType: string,
  scheduleDay?: number | null,
  scheduleDate?: Date | null
): string => {
  const [hours, minutes] = scheduleTime.split(':').map(Number);
  
  switch (scheduleType) {
    case 'once':
      if (!scheduleDate) throw new Error('Schedule date is required for once schedule');
      const date = new Date(scheduleDate);
      return `${minutes} ${hours} ${date.getDate()} ${date.getMonth() + 1} *`;
    
    case 'daily':
      return `${minutes} ${hours} * * *`;
    
    case 'weekly':
      if (scheduleDay === undefined || scheduleDay === null) throw new Error('Schedule day is required for weekly schedule');
      return `${minutes} ${hours} * * ${scheduleDay}`;
    
    default:
      throw new Error(`Unknown schedule type: ${scheduleType}`);
  }
};

/**
 * Xử lý quy tắc tự động hóa
 * @param gardenId ID của vườn
 * @param sensorData Dữ liệu cảm biến hiện tại
 */
export const processAutomationRules = async (gardenId: string, sensorData: SensorData): Promise<void> => {
  try {
    // Lấy tất cả quy tắc đang active của vườn, sắp xếp theo priority giảm dần
    const rules = await db.automationRule.findMany({
      where: {
        gardenId,
        isActive: true,
        sensorType: { not: 'schedule' } // Bỏ qua các quy tắc lập lịch
      },
      orderBy: {
        priority: 'desc'
      }
    });
    
    // Lấy thông tin vườn
    const garden = await db.garden.findUnique({
      where: { id: gardenId },
      include: { deviceStatus: { take: 1, orderBy: { updatedAt: 'desc' } } }
    });
    
    if (!garden || !garden.deviceStatus[0]) {
      throw new Error('Garden or device status not found');
    }
    
    // Danh sách thiết bị đã được điều khiển trong lần xử lý này
    const controlledDevices = new Set<string>();
    
    // Xử lý từng quy tắc theo thứ tự ưu tiên
    for (const rule of rules) {
      // Nếu thiết bị đã được điều khiển bởi quy tắc có priority cao hơn, bỏ qua
      if (controlledDevices.has(rule.actionDevice)) {
        continue;
      }
      
      // Kiểm tra điều kiện và delay
      const conditionMet = checkRuleCondition(rule, sensorData);
      const canExecute = await canExecuteRule(rule.id);
      
      if (conditionMet && canExecute) {
        // Thực hiện điều khiển thiết bị
        const control: Record<string, boolean> = {};
        control[rule.actionDevice] = rule.actionStatus;
        
        await deviceService.controlDevice(gardenId, garden.userId, control);
        
        // Đánh dấu thiết bị đã được điều khiển
        controlledDevices.add(rule.actionDevice);
        
        // Đánh dấu quy tắc đã được thực hiện
        await markRuleExecuted(rule);
        
        // Cập nhật thời gian thực hiện gần nhất
        await db.automationRule.update({
          where: { id: rule.id },
          data: { lastExecuted: new Date() }
        });
        
        // Ghi log
        await db.systemLog.create({
          data: {
            gardenId,
            eventType: 'automation_rule_executed',
            description: `Rule ${rule.id} executed: ${rule.sensorType} ${rule.conditionOperator} ${rule.thresholdValue} => ${rule.actionDevice} ${rule.actionStatus ? 'ON' : 'OFF'}`,
            level: 'info'
          }
        });
      }
    }
  } catch (error) {
    console.error('Error processing automation rules:', error);
    
    // Ghi log lỗi
    await db.systemLog.create({
      data: {
        gardenId,
        eventType: 'automation_rule_error',
        description: `Error processing automation rules: ${error instanceof Error ? error.message : 'Unknown error'}`,
        level: 'error'
      }
    });
  }
};

/**
 * Kiểm tra xung đột giữa các quy tắc
 * @param rules Danh sách quy tắc cần kiểm tra
 * @returns Danh sách các xung đột
 */
export const checkRuleConflicts = (rules: AutomationRule[]): { rule1: AutomationRule; rule2: AutomationRule }[] => {
  const conflicts: { rule1: AutomationRule; rule2: AutomationRule }[] = [];
  
  // Nhóm các quy tắc theo thiết bị điều khiển
  const rulesByDevice: Record<string, AutomationRule[]> = {};
  
  for (const rule of rules) {
    if (!rulesByDevice[rule.actionDevice]) {
      rulesByDevice[rule.actionDevice] = [];
    }
    rulesByDevice[rule.actionDevice].push(rule);
  }
  
  // Kiểm tra xung đột trong mỗi nhóm
  for (const device in rulesByDevice) {
    const deviceRules = rulesByDevice[device];
    
    for (let i = 0; i < deviceRules.length; i++) {
      for (let j = i + 1; j < deviceRules.length; j++) {
        const rule1 = deviceRules[i];
        const rule2 = deviceRules[j];
        
        // Nếu hai quy tắc có cùng sensor type và điều kiện ngược nhau
        if (rule1.sensorType === rule2.sensorType && rule1.actionStatus !== rule2.actionStatus) {
          // Kiểm tra điều kiện ngược nhau
          if (
            (rule1.conditionOperator === '>' && rule2.conditionOperator === '<' && rule1.thresholdValue <= rule2.thresholdValue) ||
            (rule1.conditionOperator === '<' && rule2.conditionOperator === '>' && rule1.thresholdValue >= rule2.thresholdValue) ||
            (rule1.conditionOperator === '>=' && rule2.conditionOperator === '<=' && rule1.thresholdValue < rule2.thresholdValue) ||
            (rule1.conditionOperator === '<=' && rule2.conditionOperator === '>=' && rule1.thresholdValue > rule2.thresholdValue)
          ) {
            conflicts.push({ rule1, rule2 });
          }
        }
      }
    }
  }
  
  return conflicts;
};

/**
 * Lập lịch cho một quy tắc tự động hóa
 * @param rule Quy tắc cần lập lịch
 */
export const scheduleAutomationRule = async (rule: AutomationRule): Promise<void> => {
  // Hủy job cũ nếu có
  if (scheduledJobs[rule.id]) {
    scheduledJobs[rule.id].stop();
    delete scheduledJobs[rule.id];
  }
  
  // Nếu quy tắc không phải loại lập lịch hoặc không active, không cần lập lịch
  if (rule.sensorType !== 'schedule' || !rule.isActive || !rule.scheduleTime || !rule.scheduleType) {
    return;
  }
  
  try {
    // Tạo cron expression
    const cronExpression = createCronExpression(
      rule.scheduleTime,
      rule.scheduleType,
      rule.scheduleDay,
      rule.scheduleDate
    );
    
    // Tạo job mới
    const job = cron.schedule(cronExpression, async () => {
      try {
        // Kiểm tra lại quy tắc có còn active không
        const currentRule = await db.automationRule.findUnique({
          where: { id: rule.id }
        });
        
        if (!currentRule || !currentRule.isActive) {
          job.stop();
          delete scheduledJobs[rule.id];
          return;
        }
        
        // Thực hiện điều khiển thiết bị
        const garden = await db.garden.findUnique({
          where: { id: rule.gardenId }
        });
        
        if (!garden) {
          throw new Error('Garden not found');
        }
        
        await deviceService.controlDevice(rule.gardenId, garden.userId, {
          [rule.actionDevice]: rule.actionStatus
        });
        
        // Cập nhật thời gian thực hiện gần nhất
        await db.automationRule.update({
          where: { id: rule.id },
          data: { lastExecuted: new Date() }
        });
        
        // Ghi log
        await db.systemLog.create({
          data: {
            gardenId: rule.gardenId,
            eventType: 'scheduled_rule_executed',
            description: `Scheduled rule ${rule.id} executed: ${rule.scheduleType} at ${rule.scheduleTime} => ${rule.actionDevice} ${rule.actionStatus ? 'ON' : 'OFF'}`,
            level: 'info'
          }
        });
        
        // Nếu là lịch một lần, vô hiệu hóa quy tắc sau khi thực hiện
        if (rule.scheduleType === 'once') {
          await db.automationRule.update({
            where: { id: rule.id },
            data: { isActive: false }
          });
          
          job.stop();
          delete scheduledJobs[rule.id];
        }
      } catch (error) {
        console.error(`Scheduled job error (${rule.id}):`, error);
        
        // Ghi log lỗi
        await db.systemLog.create({
          data: {
            gardenId: rule.gardenId,
            eventType: 'scheduled_rule_error',
            description: `Error executing scheduled rule ${rule.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            level: 'error'
          }
        });
      }
    });
    
    // Lưu job vào danh sách đang chạy
    scheduledJobs[rule.id] = job;
    
    console.log(`Scheduled rule ${rule.id} with cron: ${cronExpression}`);
  } catch (error) {
    console.error(`Error scheduling rule ${rule.id}:`, error);
  }
};

/**
 * Khởi tạo lại tất cả các quy tắc lập lịch
 * Được gọi khi server khởi động
 */
export const initializeScheduledRules = async (): Promise<void> => {
  try {
    // Lấy tất cả các quy tắc lập lịch đang active
    const scheduledRules = await db.automationRule.findMany({
      where: {
        sensorType: 'schedule',
        isActive: true
      }
    });
    
    // Lập lịch cho từng quy tắc
    for (const rule of scheduledRules) {
      await scheduleAutomationRule(rule);
    }
    
    console.log(`Initialized ${scheduledRules.length} scheduled rules`);
  } catch (error) {
    console.error('Initialize scheduled rules error:', error);
  }
};

/**
 * Hủy lịch cho một quy tắc
 * @param ruleId ID của quy tắc cần hủy lịch
 */
export const cancelScheduledRule = async (ruleId: string): Promise<void> => {
  if (scheduledJobs[ruleId]) {
    scheduledJobs[ruleId].stop();
    delete scheduledJobs[ruleId];
    console.log(`Canceled scheduled rule ${ruleId}`);
  }
};

export const automationService = {
  processAutomationRules,
  checkRuleConflicts,
  scheduleAutomationRule,
  initializeScheduledRules,
  cancelScheduledRule
}; 