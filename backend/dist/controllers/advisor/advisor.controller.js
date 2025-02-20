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
exports.analyzeGardenData = void 0;
const gemini_service_1 = require("../../services/ai/gemini.service");
const Advisor_1 = require("../../models/Advisor");
const SensorData_1 = require("../../models/SensorData");
const analyzeGardenData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        // Lấy dữ liệu cảm biến mới nhất
        const latestData = yield SensorData_1.SensorData.getLatest('main-sensor');
        if (!latestData) {
            res.status(404).json({ error: 'No sensor data available' });
            return;
        }
        const sensorData = {
            temperature: Number(latestData.get('temperature')),
            humidity: Number(latestData.get('humidity')),
            soilMoisture: Number(latestData.get('soilMoisture')),
            light: Number(latestData.get('light')),
        };
        // Validate sensor data
        if (isNaN(sensorData.temperature) || isNaN(sensorData.humidity) ||
            isNaN(sensorData.soilMoisture) || isNaN(sensorData.light)) {
            res.status(400).json({ error: 'Invalid sensor data values' });
            return;
        }
        try {
            // Phân tích dữ liệu bằng Gemini AI
            const analysis = yield gemini_service_1.geminiService.analyzeGardenData(sensorData);
            // Validate analysis response
            if (!analysis || typeof analysis.healthScore !== 'number' ||
                !Array.isArray(analysis.recommendations) || !analysis.analysis) {
                throw new Error('Invalid AI analysis response');
            }
            // Lưu kết quả phân tích vào database
            const advisor = yield Advisor_1.Advisor.create({
                userId: userId.toString(),
                sensorData,
                healthScore: analysis.healthScore,
                recommendations: analysis.recommendations,
                analysis: analysis.analysis,
            });
            res.json(advisor);
        }
        catch (aiError) {
            console.error('AI analysis failed, using basic analysis:', aiError);
            // Fallback to basic analysis
            const basicAnalysis = gemini_service_1.geminiService.analyzeDataBasic(sensorData);
            const advisor = yield Advisor_1.Advisor.create({
                userId: userId.toString(),
                sensorData,
                healthScore: basicAnalysis.healthScore,
                recommendations: basicAnalysis.recommendations,
                analysis: basicAnalysis.analysis,
            });
            res.json(advisor);
        }
    }
    catch (error) {
        console.error('Error in analyzeGardenData:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ?
                error instanceof Error ? error.message : 'Unknown error'
                : undefined
        });
    }
});
exports.analyzeGardenData = analyzeGardenData;
