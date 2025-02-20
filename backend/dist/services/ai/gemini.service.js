"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.geminiService = void 0;
const generative_ai_1 = require("@google/generative-ai");
const crypto_1 = require("crypto");
class GeminiService {
    constructor() {
        this.genAI = null;
        this.model = null;
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey) {
            try {
                this.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
                this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
            }
            catch (error) {
                console.error('Failed to initialize Gemini AI:', error);
            }
        }
        else {
            console.warn('GEMINI_API_KEY not configured, falling back to basic analysis');
        }
    }
    analyzeGardenData(data) {
        return __awaiter(this, void 0, void 0, function* () {
            // Nếu không có Gemini AI, sử dụng phân tích cơ bản
            if (!this.genAI || !this.model) {
                return this.analyzeDataBasic(data);
            }
            try {
                const prompt = `Analyze the following sensor data from a smart garden and provide recommendations:
      Temperature: ${data.temperature}°C
      Soil Moisture: ${data.soilMoisture}%
      Light Level: ${data.light} Lux
      Air Humidity: ${data.humidity}%

      Consider:
      - Optimal temperature range: 20-30°C
      - Optimal soil moisture: 50-70%
      - Optimal light level: 400-600 Lux
      - Optimal humidity: 60-80%

      Please provide:
      1. A health score (0-100)
      2. A list of specific actions needed with devices (led, fan, pump)
      3. A brief analysis in Vietnamese

      Format the response as JSON with the following structure:
      {
        "healthScore": number,
        "recommendations": [
          {
            "device": string,
            "action": "on" | "off",
            "duration": number,
            "title": string,
            "description": string
          }
        ],
        "analysis": string
      }`;
                const result = yield this.model.generateContent(prompt);
                const response = result.response;
                const text = response.text();
                // Parse JSON from AI response
                const aiResponse = JSON.parse(text);
                // Validate and transform response
                const validatedResponse = {
                    healthScore: Math.min(100, Math.max(0, aiResponse.healthScore)),
                    recommendations: aiResponse.recommendations.map((rec) => ({
                        id: (0, crypto_1.randomUUID)(),
                        title: rec.title,
                        description: rec.description,
                        device: rec.device,
                        action: rec.action,
                        duration: rec.duration,
                    })),
                    analysis: aiResponse.analysis,
                };
                return validatedResponse;
            }
            catch (error) {
                console.error('Error analyzing with Gemini:', error);
                // Fallback to basic analysis on error
                return this.analyzeDataBasic(data);
            }
        });
    }
    analyzeUsagePatterns(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.genAI || !this.model) {
                return this.analyzeUsageBasic(data);
            }
            try {
                const prompt = `Analyze the following usage data from a smart garden and provide optimization recommendations:

      Energy Usage:
      - Total: ${data.energy.total} kWh
      - By Device:
      ${data.energy.byDevice.map(d => `  * ${d.deviceName}: ${d.powerUsage} kWh (${d.hoursActive}h)`).join('\n')}

      Water Usage:
      - Total: ${data.water.total} liters
      - By Pump:
      ${data.water.byPump.map(p => `  * ${p.pumpName}: ${p.liters} liters (${p.hoursActive}h)`).join('\n')}

      Predictions for next week:
      - Energy: ${data.prediction.energy} kWh
      - Water: ${data.prediction.water} liters

      Please provide optimization recommendations in Vietnamese that can help reduce energy and water consumption.
      Focus on:
      1. Scheduling optimization
      2. Usage patterns
      3. Potential savings

      IMPORTANT: You must respond with a valid JSON array in the following format:
      [
        {
          "title": "Tiêu đề khuyến nghị",
          "description": "Mô tả chi tiết",
          "savings": {
            "energy": 10,
            "water": 20
          }
        }
      ]

      DO NOT include any text outside the JSON array. The response must be a valid JSON array that can be parsed.`;
                const result = yield this.model.generateContent(prompt);
                const response = result.response;
                const text = response.text();
                try {
                    // Tìm JSON array trong phản hồi
                    const match = text.match(/\[[\s\S]*\]/);
                    if (!match) {
                        throw new Error('No JSON array found in response');
                    }
                    // Parse JSON từ phần khớp
                    const recommendations = JSON.parse(match[0]);
                    // Validate recommendations
                    return recommendations.map((rec) => {
                        var _a, _b;
                        return ({
                            title: rec.title || 'Không có tiêu đề',
                            description: rec.description || 'Không có mô tả',
                            savings: {
                                energy: typeof ((_a = rec.savings) === null || _a === void 0 ? void 0 : _a.energy) === 'number' ? rec.savings.energy : null,
                                water: typeof ((_b = rec.savings) === null || _b === void 0 ? void 0 : _b.water) === 'number' ? rec.savings.water : null,
                            },
                        });
                    });
                }
                catch (parseError) {
                    console.error('Error parsing Gemini response:', parseError);
                    return this.analyzeUsageBasic(data);
                }
            }
            catch (error) {
                console.error('Error analyzing usage patterns with Gemini:', error);
                return this.analyzeUsageBasic(data);
            }
        });
    }
    analyzeDataBasic(data) {
        const recommendations = [];
        let healthScore = 100;
        if (data.light < 400) {
            recommendations.push({
                id: (0, crypto_1.randomUUID)(),
                title: 'Tăng thời gian chiếu sáng',
                description: `Ánh sáng hiện tại ${data.light} Lux (ngưỡng tối ưu: 500 Lux)`,
                device: 'led',
                action: 'on',
                duration: 7200,
            });
            healthScore -= 20;
        }
        if (data.soilMoisture < 50) {
            recommendations.push({
                id: (0, crypto_1.randomUUID)(),
                title: 'Bật máy bơm',
                description: `Độ ẩm đất ${data.soilMoisture}% (ngưỡng tối thiểu: 50%)`,
                device: 'pump',
                action: 'on',
                duration: 300,
            });
            healthScore -= 25;
        }
        if (data.temperature > 30) {
            recommendations.push({
                id: (0, crypto_1.randomUUID)(),
                title: 'Bật quạt làm mát',
                description: `Nhiệt độ hiện tại ${data.temperature}°C (ngưỡng tối đa: 30°C)`,
                device: 'fan',
                action: 'on',
                duration: 1800,
            });
            healthScore -= 15;
        }
        return {
            healthScore: Math.max(0, healthScore),
            recommendations,
            analysis: recommendations.length > 0
                ? 'Cây cần được điều chỉnh một số thông số để đạt điều kiện tối ưu.'
                : 'Các thông số đều trong ngưỡng tốt, tiếp tục duy trì chế độ chăm sóc hiện tại.',
        };
    }
    analyzeUsageBasic(data) {
        const recommendations = [];
        // Phân tích cơ bản dựa trên ngưỡng
        if (data.energy.total > 100) {
            recommendations.push({
                title: 'Giảm tiêu thụ điện',
                description: 'Mức tiêu thụ điện cao hơn bình thường. Hãy kiểm tra các thiết bị có công suất lớn.',
                savings: {
                    energy: 20,
                },
            });
        }
        if (data.water.total > 1000) {
            recommendations.push({
                title: 'Tối ưu hóa tưới nước',
                description: 'Lượng nước sử dụng cao. Nên điều chỉnh lịch tưới và kiểm tra rò rỉ.',
                savings: {
                    water: 200,
                },
            });
        }
        return recommendations;
    }
}
exports.geminiService = new GeminiService();
