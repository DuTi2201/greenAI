import { GoogleGenerativeAI } from '@google/generative-ai';
import { Advice } from '../models/Advice';
import { Device } from '../models/Device';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface SensorData {
  temperature: number;
  humidity: number;
  soilMoisture: number;
  light: number;
}

interface Action {
  device: string;
  action: 'on' | 'off';
  duration?: number;
}

interface AdviceResponse {
  status: string;
  advice: string[];
  healthScore: number;
  actions: Action[];
}

export class AdvisorService {
  private static async generateAdvice(data: SensorData): Promise<AdviceResponse> {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
      Phân tích dữ liệu cảm biến sau và đưa ra đề xuất chăm sóc cây trồng:
      - Nhiệt độ: ${data.temperature}°C
      - Độ ẩm không khí: ${data.humidity}%
      - Độ ẩm đất: ${data.soilMoisture}%
      - Ánh sáng: ${data.light} Lux

      Hãy đưa ra:
      1. Đánh giá sức khỏe cây trồng (thang điểm 0-100)
      2. Các đề xuất cụ thể để cải thiện điều kiện
      3. Các hành động cần thực hiện với thiết bị (bật/tắt đèn, quạt, máy bơm)
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse AI response
      const lines = text.split('\n');
      const healthScore = parseInt(lines[0].match(/\d+/)?.[0] || '75');
      const suggestions = lines
        .filter(line => line.startsWith('-'))
        .map(line => line.substring(2));
      
      // Generate actions based on suggestions
      const actions: Action[] = [];
      if (text.includes('đèn') || data.light < 800) {
        actions.push({ device: 'led', action: 'on', duration: 7200 });
      }
      if (text.includes('quạt') || data.temperature > 30) {
        actions.push({ device: 'fan', action: 'on', duration: 1800 });
      }
      if (text.includes('nước') || data.soilMoisture < 30) {
        actions.push({ device: 'pump', action: 'on', duration: 300 });
      }

      return {
        status: 'success',
        advice: suggestions,
        healthScore,
        actions
      };
    } catch (error) {
      console.error('Error generating advice:', error);
      throw new Error('Failed to generate advice');
    }
  }

  static async getAdvice(data: SensorData): Promise<AdviceResponse> {
    // Generate advice using AI
    const advice = await this.generateAdvice(data);
    
    // Save to database
    await Advice.create({
      ...data,
      healthScore: advice.healthScore,
      suggestions: advice.advice,
      actions: advice.actions,
    });

    return advice;
  }

  static async applyActions(actions: Action[]): Promise<void> {
    for (const action of actions) {
      const device = await Device.findOne({ where: { name: action.device } });
      if (device) {
        await device.update({
          status: action.action === 'on' ? 'active' : 'inactive',
          lastActive: new Date(),
        });
      }
    }
  }
} 