import { db } from '../singleton';
import { deviceService } from './device.service';
import { AutomationRule } from '@prisma/client';
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

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
        isActive: true
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

export const automationService = {
  processAutomationRules,
  checkRuleConflicts
}; 