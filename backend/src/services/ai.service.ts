import type { Garden, SensorData, DeviceStatus } from '../types';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Redis } from 'ioredis';
import { db } from '../singleton';

interface AnalysisParams {
  garden: Garden;
  sensorData: SensorData[];
  deviceStatus: DeviceStatus[];
  analysisType: string;
  startDate: Date;
  endDate: Date;
}

// Khởi tạo Redis client
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Khởi tạo Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// Thời gian cache mặc định (24 giờ)
const DEFAULT_CACHE_TTL = 24 * 60 * 60;

// Cache TTL cho từng loại phân tích
const CACHE_TTL_MAP: Record<string, number> = {
  'daily': 6 * 60 * 60,       // 6 giờ
  'weekly': 24 * 60 * 60,     // 24 giờ
  'monthly': 3 * 24 * 60 * 60, // 3 ngày
  'custom': 12 * 60 * 60      // 12 giờ
};

/**
 * Tạo key cache cho phân tích AI
 * @param gardenId ID của vườn
 * @param analysisType Loại phân tích
 * @param startDate Ngày bắt đầu
 * @param endDate Ngày kết thúc
 * @returns Key cache
 */
const createCacheKey = (gardenId: string, analysisType: string, startDate: Date, endDate: Date): string => {
  return `ai_analysis:${gardenId}:${analysisType}:${startDate.toISOString()}:${endDate.toISOString()}`;
};

/**
 * Lấy thời gian cache dựa trên loại phân tích
 * @param analysisType Loại phân tích
 * @returns Thời gian cache (giây)
 */
const getCacheTTL = (analysisType: string): number => {
  return CACHE_TTL_MAP[analysisType] || DEFAULT_CACHE_TTL;
};

/**
 * Gọi API AI với cơ chế retry
 * @param prompt Prompt cho AI
 * @param maxRetries Số lần retry tối đa
 * @returns Kết quả từ AI
 */
const callAIWithRetry = async (prompt: string, maxRetries = 3): Promise<any> => {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Thử phân tích kết quả thành JSON
      try {
        return JSON.parse(text);
      } catch (e) {
        // Nếu không phải JSON, trả về text
        return { text };
      }
    } catch (error) {
      console.error(`AI API call failed (attempt ${attempt + 1}/${maxRetries}):`, error);
      lastError = error as Error;
      
      // Chờ trước khi thử lại (exponential backoff)
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('Failed to call AI API after multiple attempts');
};

/**
 * Phân tích dữ liệu vườn bằng AI
 * @param params Tham số phân tích
 * @returns Kết quả phân tích
 */
export const analyzeGardenData = async (params: AnalysisParams): Promise<any> => {
  const { garden, sensorData, deviceStatus, analysisType, startDate, endDate } = params;
  
  // Tạo key cache
  const cacheKey = createCacheKey(garden.id, analysisType, startDate, endDate);
  
  // Kiểm tra cache
  const cachedResult = await redis.get(cacheKey);
  if (cachedResult) {
    try {
      return JSON.parse(cachedResult);
    } catch (error) {
      console.error('Failed to parse cached result:', error);
      // Nếu parse thất bại, tiếp tục phân tích mới
    }
  }

  // Chuẩn bị dữ liệu cho AI
  const data = {
    garden: {
      name: garden.name,
      location: garden.location,
      status: garden.status
    },
    sensorData: sensorData.map(data => ({
      temperature: data.temperature,
      humidity: data.humidity,
      lightLevel: data.lightLevel,
      soilMoisture: data.soilMoisture,
      recordedAt: data.recordedAt.toISOString()
    })),
    deviceStatus: deviceStatus.map(status => ({
      fanStatus: status.fanStatus,
      ledStatus: status.ledStatus,
      nutrientPumpStatus: status.nutrientPumpStatus,
      waterPumpStatus: status.waterPumpStatus,
      updatedAt: status.updatedAt.toISOString()
    })),
    period: {
      start: startDate.toISOString(),
      end: endDate.toISOString()
    }
  };

  // Tạo prompt cho AI dựa trên loại phân tích
  let prompt = '';
  switch (analysisType) {
    case 'growth':
      prompt = `Analyze the growth conditions of the garden "${garden.name}" based on the following data:
1. Analyze temperature trends and their impact on plant growth
2. Evaluate humidity levels and suggest improvements
3. Assess light exposure patterns
4. Review soil moisture management
5. Provide recommendations for optimal growth conditions

Data: ${JSON.stringify(data, null, 2)}

Please provide a detailed analysis in JSON format with the following structure:
{
  "temperatureAnalysis": { "trends": [], "impact": "", "recommendations": [] },
  "humidityAnalysis": { "levels": [], "issues": [], "improvements": [] },
  "lightAnalysis": { "patterns": [], "concerns": [], "suggestions": [] },
  "soilAnalysis": { "management": "", "issues": [], "recommendations": [] },
  "overallRecommendations": []
}`;
      break;

    case 'efficiency':
      prompt = `Analyze the device usage efficiency in the garden "${garden.name}" based on the following data:
1. Evaluate device activation patterns
2. Identify potential energy waste
3. Analyze response to environmental conditions
4. Calculate device usage statistics
5. Suggest optimization strategies

Data: ${JSON.stringify(data, null, 2)}

Please provide a detailed analysis in JSON format with the following structure:
{
  "devicePatterns": { "fan": [], "led": [], "nutrientPump": [], "waterPump": [] },
  "energyEfficiency": { "issues": [], "improvements": [] },
  "responseAnalysis": { "effectiveness": "", "issues": [], "recommendations": [] },
  "usageStatistics": { "fan": {}, "led": {}, "nutrientPump": {}, "waterPump": {} },
  "optimizationStrategies": []
}`;
      break;

    case 'issues':
      prompt = `Identify potential issues in the garden "${garden.name}" based on the following data:
1. Detect abnormal sensor readings
2. Identify suboptimal device operations
3. Analyze environmental stress indicators
4. Evaluate maintenance needs
5. Prioritize issues by severity

Data: ${JSON.stringify(data, null, 2)}

Please provide a detailed analysis in JSON format with the following structure:
{
  "sensorIssues": { "temperature": [], "humidity": [], "light": [], "soil": [] },
  "deviceIssues": { "fan": [], "led": [], "nutrientPump": [], "waterPump": [] },
  "environmentalStress": { "indicators": [], "risks": [], "solutions": [] },
  "maintenanceNeeds": { "immediate": [], "scheduled": [], "preventive": [] },
  "prioritizedIssues": []
}`;
      break;

    default:
      throw new Error('Invalid analysis type');
  }

  // Gọi AI API với retry
  const result = await callAIWithRetry(prompt);
  
  // Lưu kết quả vào cache
  await redis.set(cacheKey, JSON.stringify(result), 'EX', getCacheTTL(analysisType));
  
  // Lưu kết quả vào database
  await db.aIReport.create({
    data: {
      gardenId: garden.id,
      reportType: analysisType,
      result,
      analysisPeriodStart: startDate,
      analysisPeriodEnd: endDate,
      geminiModelVersion: 'gemini-pro',
      status: 'completed',
      reportFormat: 'JSON'
    }
  });
  
  return result;
};

/**
 * Tạo báo cáo AI tự động hàng tuần
 * @param gardenId ID của vườn
 */
export const generateWeeklyReport = async (gardenId: string): Promise<void> => {
  try {
    // Lấy thông tin vườn
    const garden = await db.garden.findUnique({
      where: { id: gardenId }
    });
    
    if (!garden) {
      throw new Error(`Garden not found: ${gardenId}`);
    }
    
    // Tính thời gian phân tích (7 ngày gần nhất)
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 7);
    
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
    
    // Nếu không có đủ dữ liệu, bỏ qua
    if (sensorData.length === 0) {
      console.log(`Not enough data for garden ${gardenId} to generate weekly report`);
      return;
    }
    
    // Phân tích dữ liệu
    await analyzeGardenData({
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
      analysisType: 'weekly',
      startDate,
      endDate
    });
    
    console.log(`Weekly report generated for garden ${gardenId}`);
  } catch (error) {
    console.error(`Failed to generate weekly report for garden ${gardenId}:`, error);
    
    // Ghi log lỗi
    await db.systemLog.create({
      data: {
        gardenId,
        eventType: 'weekly_report_error',
        description: `Failed to generate weekly report: ${error instanceof Error ? error.message : 'Unknown error'}`,
        level: 'error'
      }
    });
  }
};

/**
 * Xóa báo cáo AI cũ (giữ lại 6 tháng gần nhất)
 */
export const cleanupOldReports = async (): Promise<void> => {
  try {
    // Tính thời gian 6 tháng trước
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    // Xóa các báo cáo cũ hơn 6 tháng
    const result = await db.aIReport.deleteMany({
      where: {
        createdAt: {
          lt: sixMonthsAgo
        }
      }
    });
    
    console.log(`Cleaned up ${result.count} old AI reports`);
  } catch (error) {
    console.error('Failed to clean up old AI reports:', error);
  }
}; 