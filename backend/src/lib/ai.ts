import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '../server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'your-api-key');

export interface GenerateAIReportParams {
  deviceId: string;
  reportType: string;
  startDate: string;
  endDate: string;
}

export const generateAIReport = async ({
  deviceId,
  reportType,
  startDate,
  endDate
}: GenerateAIReportParams) => {
  try {
    // Get sensor data for the period
    const sensorData = await prisma.sensorData.findMany({
      where: {
        gardenId: deviceId,
        recordedAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      orderBy: {
        recordedAt: 'asc'
      }
    });

    if (sensorData.length === 0) {
      throw new Error('No sensor data available for the specified period');
    }

    // Prepare data for analysis
    const data = {
      temperature: sensorData.map((d) => Number(d.temperature)),
      humidity: sensorData.map((d) => Number(d.humidity)),
      soilMoisture: sensorData.map((d) => Number(d.soilMoisture)),
      lightLevel: sensorData.map((d) => Number(d.lightLevel)),
      timestamps: sensorData.map((d) => d.recordedAt.toISOString())
    };

    // Get device information
    const device = await prisma.garden.findUnique({
      where: { id: deviceId },
      include: {
        deviceStatus: {
          orderBy: {
            updatedAt: 'desc'
          },
          take: 1
        }
      }
    });

    if (!device) {
      throw new Error('Device not found');
    }

    // Prepare prompt based on report type
    let prompt = '';
    switch (reportType) {
      case 'daily':
        prompt = `Analyze the following garden sensor data for ${device.name} from ${startDate} to ${endDate}:

Temperature readings: ${JSON.stringify(data.temperature)}
Humidity readings: ${JSON.stringify(data.humidity)}
Soil moisture readings: ${JSON.stringify(data.soilMoisture)}
Light level readings: ${JSON.stringify(data.lightLevel)}

Please provide:
1. A summary of environmental conditions
2. Any concerning patterns or anomalies
3. Recommendations for optimal plant growth
4. Suggested adjustments to device settings`;
        break;

      case 'weekly':
        prompt = `Analyze the weekly trends in garden sensor data for ${device.name} from ${startDate} to ${endDate}:

Temperature trends: ${JSON.stringify(data.temperature)}
Humidity trends: ${JSON.stringify(data.humidity)}
Soil moisture trends: ${JSON.stringify(data.soilMoisture)}
Light level trends: ${JSON.stringify(data.lightLevel)}

Please provide:
1. Weekly patterns and trends analysis
2. Performance against optimal ranges
3. Long-term recommendations
4. Maintenance suggestions`;
        break;

      default:
        throw new Error('Invalid report type');
    }

    // Generate AI analysis
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysis = response.text();

    // Save report to database
    await prisma.aIReport.create({
      data: {
        gardenId: deviceId,
        reportType,
        result: analysis,
        analysisPeriodStart: new Date(startDate),
        analysisPeriodEnd: new Date(endDate),
        geminiModelVersion: 'gemini-pro'
      }
    });

    return analysis;
  } catch (error) {
    console.error('Error generating AI report:', error);
    throw new Error('Failed to generate AI report');
  }
}; 