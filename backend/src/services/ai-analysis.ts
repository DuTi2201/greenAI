import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '../prisma';

interface AnalysisResult {
  summary: string;
  recommendations: string[];
  alerts: string[];
  healthScore: number;
}

// Được sử dụng trong phân tích dữ liệu cảm biến
export interface SensorDataRecord {
  recordedAt: Date;
  temperature: number;
  humidity: number;
  soilMoisture: number;
  lightLevel: number;
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function analyzePlantGrowth(
  gardenId: string,
  plantId: string,
  startDate: Date,
  endDate: Date
): Promise<AnalysisResult> {
  try {
    // Get plant and sensor data
    const [plant, sensorData] = await Promise.all([
      prisma.plant.findUnique({ where: { id: plantId } }),
      prisma.sensorData.findMany({
        where: {
          gardenId,
          recordedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          recordedAt: 'asc',
        },
      }),
    ]);

    if (!plant || sensorData.length === 0) {
      throw new Error('No data available for analysis');
    }

    // Prepare data for AI analysis
    const prompt = `
      Analyze the growth conditions for ${plant.name} with the following optimal ranges:
      - Temperature: ${plant.optimalTemperatureMin}°C to ${plant.optimalTemperatureMax}°C
      - Humidity: ${plant.optimalHumidityMin}% to ${plant.optimalHumidityMax}%
      - Soil Moisture: ${plant.optimalSoilMoistureMin}% to ${plant.optimalSoilMoistureMax}%
      - Light Level: ${plant.optimalLightLevelMin} to ${plant.optimalLightLevelMax}

      Current sensor data (last ${sensorData.length} readings):
      ${sensorData
        .map(
          (data) =>
            `${data.recordedAt.toISOString()}: Temp=${Number(data.temperature)}°C, Humidity=${
              Number(data.humidity)
            }%, Soil=${Number(data.soilMoisture)}%, Light=${Number(data.lightLevel)}`
        )
        .join('\n')}

      Please provide:
      1. A summary of the growing conditions
      2. Specific recommendations for improvement
      3. Any alerts or warnings
      4. A health score from 0-100
    `;

    // Get AI analysis
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse AI response
    const analysis = parseAIResponse(text);

    // Save analysis to database
    await prisma.aIReport.create({
      data: {
        gardenId,
        reportType: 'plant-growth',
        result: analysis as any,
        status: 'completed',
        reportFormat: 'json',
        analysisPeriodStart: startDate,
        analysisPeriodEnd: endDate,
        geminiModelVersion: 'gemini-pro',
      },
    });

    return analysis;
  } catch (error) {
    console.error('Failed to analyze plant growth:', error);
    throw error;
  }
}

function parseAIResponse(text: string): AnalysisResult {
  // Simple parsing logic - in real app, use more robust parsing
  const sections = text.split('\n\n');
  
  return {
    summary: sections[0] || '',
    recommendations: (sections[1] || '').split('\n').filter(Boolean),
    alerts: (sections[2] || '').split('\n').filter(Boolean),
    healthScore: parseFloat(sections[3] || '0') || 0,
  };
} 