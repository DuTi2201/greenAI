import type { Garden, SensorData, DeviceStatus, AIReport, AIAlert } from '../types';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Redis } from 'ioredis';
import { db } from '../singleton';
import { prisma } from '../prisma';
import { AIAnalysisRequest } from '../types';

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

/**
 * Dự đoán xu hướng dữ liệu cảm biến trong tương lai
 * @param gardenId ID của vườn
 * @param predictionHorizon Số ngày dự đoán trong tương lai
 * @returns Kết quả dự đoán
 */
export const predictSensorTrends = async (gardenId: string, predictionHorizon: number = 7): Promise<any> => {
  try {
    // Lấy thông tin vườn
    const garden = await db.garden.findUnique({
      where: { id: gardenId }
    });
    
    if (!garden) {
      throw new Error(`Garden not found: ${gardenId}`);
    }
    
    // Lấy dữ liệu cảm biến 30 ngày gần nhất để dự đoán
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 30);
    
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
    
    if (sensorData.length === 0) {
      throw new Error('Không đủ dữ liệu cảm biến để dự đoán');
    }
    
    // Chuẩn bị dữ liệu cho AI
    const data = {
      garden: {
        name: garden.name,
        location: garden.location,
        status: garden.status
      },
      sensorData: sensorData.map(data => ({
        temperature: Number(data.temperature),
        humidity: Number(data.humidity),
        lightLevel: Number(data.lightLevel),
        soilMoisture: Number(data.soilMoisture),
        recordedAt: data.recordedAt.toISOString()
      })),
      predictionHorizon,
      currentDate: new Date().toISOString()
    };
    
    // Tạo prompt cho AI
    const prompt = `Predict future sensor trends for the garden "${garden.name}" based on historical data:
1. Analyze the past 30 days of sensor data
2. Predict temperature, humidity, soil moisture, and light levels for the next ${predictionHorizon} days
3. Identify potential issues or anomalies in the predicted values
4. Provide confidence levels for each prediction
5. Suggest actions to optimize garden conditions

Data: ${JSON.stringify(data, null, 2)}

Please provide a detailed prediction in JSON format with the following structure:
{
  "predictions": {
    "temperature": [{"date": "YYYY-MM-DD", "value": 25.5, "confidence": 0.85}],
    "humidity": [{"date": "YYYY-MM-DD", "value": 65.2, "confidence": 0.82}],
    "soilMoisture": [{"date": "YYYY-MM-DD", "value": 42.1, "confidence": 0.78}],
    "lightLevel": [{"date": "YYYY-MM-DD", "value": 850, "confidence": 0.75}]
  },
  "alerts": [
    {"type": "temperature", "severity": "high", "message": "Predicted temperature will exceed optimal range", "timestamp": "YYYY-MM-DD"}
  ],
  "recommendations": [
    "Consider adjusting watering schedule on [date] due to predicted low soil moisture"
  ]
}`;
    
    // Gọi AI API với retry
    const result = await callAIWithRetry(prompt);
    
    // Xử lý cảnh báo
    if (result.alerts && Array.isArray(result.alerts)) {
      await processAlerts(gardenId, result.alerts);
    }
    
    return result;
  } catch (error) {
    console.error('Prediction error:', error);
    throw error;
  }
};

/**
 * Xử lý và lưu các cảnh báo từ AI
 * @param gardenId ID của vườn
 * @param alerts Danh sách cảnh báo
 */
const processAlerts = async (gardenId: string, alerts: any[]): Promise<void> => {
  try {
    // Lưu các cảnh báo vào database
    for (const alert of alerts) {
      await db.aIAlert.create({
        data: {
          gardenId,
          type: alert.type,
          severity: alert.severity,
          message: alert.message,
          isRead: false,
          isResolved: false
        }
      });
      
      // Tạo thông báo cho người dùng
      const garden = await db.garden.findUnique({
        where: { id: gardenId },
        select: { userId: true }
      });
      
      if (garden) {
        await db.notification.create({
          data: {
            userId: garden.userId,
            gardenId,
            title: `Cảnh báo: ${alert.type}`,
            message: alert.message,
            type: `alert_${alert.severity}`,
            isRead: false
          }
        });
      }
    }
  } catch (error) {
    console.error('Failed to process alerts:', error);
  }
};

/**
 * Lấy danh sách cảnh báo của vườn
 * @param gardenId ID của vườn
 * @returns Danh sách cảnh báo
 */
export const getGardenAlerts = async (gardenId: string): Promise<AIAlert[]> => {
  return db.aIAlert.findMany({
    where: { gardenId },
    orderBy: { createdAt: 'desc' }
  });
};

/**
 * Đánh dấu cảnh báo đã đọc
 * @param alertId ID của cảnh báo
 */
export const markAlertAsRead = async (alertId: string): Promise<void> => {
  await db.aIAlert.update({
    where: { id: alertId },
    data: { isRead: true }
  });
};

/**
 * Đánh dấu cảnh báo đã giải quyết
 * @param alertId ID của cảnh báo
 */
export const resolveAlert = async (alertId: string): Promise<void> => {
  await db.aIAlert.update({
    where: { id: alertId },
    data: { isResolved: true }
  });
};

class AIService {
  async analyzeGardenData(gardenId: string, request: AIAnalysisRequest): Promise<AIReport> {
    try {
      // Tạo báo cáo mới với trạng thái 'pending'
      const report = await prisma.aIReport.create({
        data: {
          gardenId,
          reportType: request.reportType,
          analysisPeriodStart: request.timeRange.start,
          analysisPeriodEnd: request.timeRange.end,
          status: 'pending',
          geminiModelVersion: 'gemini-1.5-pro',
          reportFormat: 'json',
          result: {},
        },
      });

      // Bắt đầu phân tích dữ liệu (không đồng bộ)
      this.processAnalysis(report.id, gardenId, request).catch(error => {
        console.error(`Error processing analysis for report ${report.id}:`, error);
      });

      return report;
    } catch (error) {
      console.error('Error analyzing garden data:', error);
      throw error;
    }
  }

  private async processAnalysis(reportId: string, gardenId: string, request: AIAnalysisRequest): Promise<void> {
    try {
      // Lấy dữ liệu cảm biến trong khoảng thời gian
      const sensorData = await prisma.sensorData.findMany({
        where: {
          gardenId,
          recordedAt: {
            gte: request.timeRange.start,
            lte: request.timeRange.end,
          },
        },
        orderBy: {
          recordedAt: 'asc',
        },
      });

      if (sensorData.length === 0) {
        await this.updateReportStatus(reportId, 'failed', {
          error: 'Không có dữ liệu cảm biến trong khoảng thời gian đã chọn',
        });
        return;
      }

      // Lấy thông tin vườn
      const garden = await prisma.garden.findUnique({
        where: { id: gardenId },
      });

      if (!garden) {
        await this.updateReportStatus(reportId, 'failed', {
          error: 'Không tìm thấy thông tin vườn',
        });
        return;
      }

      // Chuẩn bị dữ liệu cho Gemini
      const prompt = this.preparePrompt(garden.name, sensorData, request.reportType);

      // Gọi Gemini API
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Phân tích kết quả từ Gemini
      const analysisResult = this.parseGeminiResponse(text);

      // Cập nhật báo cáo với kết quả
      await this.updateReportStatus(reportId, 'completed', analysisResult);

      // Tạo cảnh báo nếu cần
      if (analysisResult.alerts && analysisResult.alerts.length > 0) {
        await this.createAlerts(gardenId, analysisResult.alerts);
      }
    } catch (error) {
      console.error(`Error in processAnalysis for report ${reportId}:`, error);
      await this.updateReportStatus(reportId, 'failed', {
        error: error.message || 'Lỗi khi xử lý phân tích',
      });
    }
  }

  private async updateReportStatus(reportId: string, status: string, result: any): Promise<void> {
    await prisma.aIReport.update({
      where: { id: reportId },
      data: {
        status,
        result,
        updatedAt: new Date(),
      },
    });
  }

  private preparePrompt(gardenName: string, sensorData: any[], reportType: string): string {
    // Chuyển đổi dữ liệu cảm biến thành chuỗi JSON
    const sensorDataJson = JSON.stringify(sensorData);

    // Tạo prompt dựa trên loại báo cáo
    let prompt = `Phân tích dữ liệu vườn "${gardenName}" dựa trên dữ liệu cảm biến sau:\n${sensorDataJson}\n\n`;

    switch (reportType) {
      case 'daily':
        prompt += 'Hãy cung cấp phân tích hàng ngày về điều kiện vườn, bao gồm xu hướng nhiệt độ, độ ẩm, độ ẩm đất và ánh sáng. Xác định bất kỳ vấn đề nào và đề xuất hành động.';
        break;
      case 'weekly':
        prompt += 'Hãy cung cấp phân tích hàng tuần về điều kiện vườn, bao gồm xu hướng, so sánh với tuần trước, và đề xuất cải thiện.';
        break;
      case 'monthly':
        prompt += 'Hãy cung cấp phân tích hàng tháng về hiệu suất vườn, bao gồm xu hướng dài hạn, hiệu quả sử dụng nước và năng lượng, và đề xuất chiến lược tối ưu hóa.';
        break;
      default:
        prompt += 'Hãy phân tích dữ liệu vườn, xác định xu hướng, vấn đề tiềm ẩn, và đề xuất cải thiện.';
    }

    prompt += '\n\nVui lòng trả về kết quả dưới dạng JSON với cấu trúc sau:\n';
    prompt += `{
      "summary": "Tóm tắt tổng quan về tình trạng vườn",
      "healthScore": 85, // Điểm từ 0-100
      "insights": [
        "Insight 1",
        "Insight 2",
        "Insight 3"
      ],
      "trends": {
        "temperature": "Xu hướng nhiệt độ",
        "humidity": "Xu hướng độ ẩm",
        "soilMoisture": "Xu hướng độ ẩm đất",
        "lightLevel": "Xu hướng ánh sáng"
      },
      "recommendations": [
        "Đề xuất 1",
        "Đề xuất 2"
      ],
      "alerts": [
        {
          "type": "temperature", // temperature, humidity, soilMoisture, lightLevel
          "severity": "high", // low, medium, high, critical
          "message": "Nội dung cảnh báo"
        }
      ]
    }`;

    return prompt;
  }

  private parseGeminiResponse(response: string): any {
    try {
      // Tìm và trích xuất phần JSON từ phản hồi
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Không tìm thấy dữ liệu JSON trong phản hồi');
      }

      const jsonStr = jsonMatch[0];
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      // Trả về kết quả mặc định nếu không thể phân tích
      return {
        summary: 'Không thể phân tích dữ liệu',
        healthScore: 50,
        insights: ['Không có thông tin chi tiết do lỗi phân tích'],
        recommendations: ['Vui lòng thử lại sau'],
      };
    }
  }

  private async createAlerts(gardenId: string, alerts: any[]): Promise<void> {
    for (const alert of alerts) {
      await prisma.aIAlert.create({
        data: {
          gardenId,
          type: alert.type,
          severity: alert.severity,
          message: alert.message,
          isRead: false,
          isResolved: false,
        },
      });
    }
  }

  async predictSensorTrends(gardenId: string, predictionHorizon: number): Promise<any> {
    try {
      // Lấy dữ liệu cảm biến gần đây nhất
      const recentData = await prisma.sensorData.findMany({
        where: {
          gardenId,
        },
        orderBy: {
          recordedAt: 'desc',
        },
        take: 100, // Lấy 100 bản ghi gần nhất
      });

      if (recentData.length === 0) {
        throw new Error('Không đủ dữ liệu để dự đoán');
      }

      // Trong thực tế, bạn sẽ sử dụng mô hình ML hoặc Gemini để dự đoán
      // Ở đây chúng ta giả lập kết quả dự đoán

      // Tính toán giá trị trung bình cho mỗi loại cảm biến
      const avgTemp = this.calculateAverage(recentData.map(d => d.temperature));
      const avgHumidity = this.calculateAverage(recentData.map(d => d.humidity));
      const avgSoilMoisture = this.calculateAverage(recentData.map(d => d.soilMoisture));
      const avgLightLevel = this.calculateAverage(recentData.map(d => d.lightLevel));

      // Tạo dữ liệu dự đoán giả lập
      const predictions = {
        temperature: this.generatePredictionData(avgTemp, predictionHorizon),
        humidity: this.generatePredictionData(avgHumidity, predictionHorizon),
        soilMoisture: this.generatePredictionData(avgSoilMoisture, predictionHorizon),
        lightLevel: this.generatePredictionData(avgLightLevel, predictionHorizon),
        alerts: [],
        recommendations: [
          'Duy trì lịch tưới nước hiện tại',
          'Theo dõi nhiệt độ vào buổi trưa',
          'Cân nhắc tăng cường ánh sáng vào buổi sáng'
        ]
      };

      // Kiểm tra và tạo cảnh báo nếu cần
      this.checkForPredictionAlerts(gardenId, predictions);

      return predictions;
    } catch (error) {
      console.error('Error predicting sensor trends:', error);
      throw error;
    }
  }

  private calculateAverage(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private generatePredictionData(baseValue: number, days: number): any[] {
    const result = [];
    const now = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      
      // Thêm một chút biến động ngẫu nhiên
      const randomVariation = (Math.random() - 0.5) * 10;
      const value = baseValue + randomVariation;
      
      result.push({
        date: date.toISOString().split('T')[0],
        value: Math.round(value * 10) / 10
      });
    }
    
    return result;
  }

  private async checkForPredictionAlerts(gardenId: string, predictions: any): Promise<void> {
    const alerts = [];
    
    // Kiểm tra nhiệt độ
    const maxTemp = Math.max(...predictions.temperature.map((p: any) => p.value));
    if (maxTemp > 30) {
      alerts.push({
        type: 'temperature',
        severity: 'medium',
        message: `Dự đoán nhiệt độ cao (${maxTemp}°C) trong những ngày tới. Cân nhắc tăng cường làm mát.`
      });
    }
    
    // Kiểm tra độ ẩm đất
    const minSoilMoisture = Math.min(...predictions.soilMoisture.map((p: any) => p.value));
    if (minSoilMoisture < 30) {
      alerts.push({
        type: 'soilMoisture',
        severity: 'high',
        message: `Dự đoán độ ẩm đất thấp (${minSoilMoisture}%) trong những ngày tới. Cần tăng tần suất tưới nước.`
      });
    }
    
    // Thêm cảnh báo vào kết quả dự đoán
    predictions.alerts = alerts;
    
    // Tạo cảnh báo trong cơ sở dữ liệu
    if (alerts.length > 0) {
      await this.createAlerts(gardenId, alerts);
    }
  }
}

export const aiService = new AIService(); 