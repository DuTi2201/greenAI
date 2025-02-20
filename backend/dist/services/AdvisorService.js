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
exports.AdvisorService = void 0;
const generative_ai_1 = require("@google/generative-ai");
const Advice_1 = require("../models/Advice");
const Device_1 = require("../models/Device");
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
class AdvisorService {
    static generateAdvice(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
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
                const result = yield model.generateContent(prompt);
                const response = yield result.response;
                const text = response.text();
                // Parse AI response
                const lines = text.split('\n');
                const healthScore = parseInt(((_a = lines[0].match(/\d+/)) === null || _a === void 0 ? void 0 : _a[0]) || '75');
                const suggestions = lines
                    .filter(line => line.startsWith('-'))
                    .map(line => line.substring(2));
                // Generate actions based on suggestions
                const actions = [];
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
            }
            catch (error) {
                console.error('Error generating advice:', error);
                throw new Error('Failed to generate advice');
            }
        });
    }
    static getAdvice(data) {
        return __awaiter(this, void 0, void 0, function* () {
            // Generate advice using AI
            const advice = yield this.generateAdvice(data);
            // Save to database
            yield Advice_1.Advice.create(Object.assign(Object.assign({}, data), { healthScore: advice.healthScore, suggestions: advice.advice, actions: advice.actions }));
            return advice;
        });
    }
    static applyActions(actions) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const action of actions) {
                const device = yield Device_1.Device.findOne({ where: { name: action.device } });
                if (device) {
                    yield device.update({
                        status: action.action === 'on' ? 'active' : 'inactive',
                        lastActive: new Date(),
                    });
                }
            }
        });
    }
}
exports.AdvisorService = AdvisorService;
