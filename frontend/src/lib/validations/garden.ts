import { z } from 'zod';

export const gardenSchema = z.object({
  name: z.string().min(1, 'Tên vườn không được để trống'),
  wemosSerial: z.string().min(1, 'Mã thiết bị không được để trống'),
  location: z.string().optional(),
  deviceType: z.string().optional(),
  firmwareVersion: z.string().optional(),
});

export const automationRuleSchema = z.object({
  sensorType: z.enum(['temperature', 'humidity', 'soilMoisture', 'lightLevel']),
  conditionOperator: z.enum(['>', '<', '=', '>=', '<=']),
  thresholdValue: z.number(),
  actionDevice: z.enum(['fan', 'led', 'nutrientPump', 'waterPump']),
  actionStatus: z.boolean(),
  priority: z.number().min(0).max(10).default(0),
  delayTime: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
}); 