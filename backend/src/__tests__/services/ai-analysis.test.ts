import { prisma } from '../../prisma';
import { analyzePlantGrowth } from '../../services/ai-analysis';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Mock Google Generative AI
jest.mock('@google/generative-ai');

describe('AI Analysis Service', () => {
  let gardenId: string;
  let plantId: string;
  let userId: string;

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        passwordHash: 'test-hash',
      },
    });
    userId = user.id;

    // Create test garden
    const garden = await prisma.garden.create({
      data: {
        userId,
        name: 'Test Garden',
        wemosSerial: `WEMOS-${Date.now()}`,
        apiKey: `API-${Date.now()}`,
      },
    });
    gardenId = garden.id;

    // Create test plant
    const plant = await prisma.plant.create({
      data: {
        name: 'Test Plant',
        optimalTemperatureMin: 20,
        optimalTemperatureMax: 30,
        optimalHumidityMin: 40,
        optimalHumidityMax: 60,
        optimalSoilMoistureMin: 30,
        optimalSoilMoistureMax: 70,
        optimalLightLevelMin: 1000,
        optimalLightLevelMax: 10000,
      },
    });
    plantId = plant.id;

    // Add plant to garden
    await prisma.plantGarden.create({
      data: {
        gardenId,
        plantId,
        status: 'active',
      },
    });
  });

  beforeEach(async () => {
    // Clear previous sensor data and reports
    await prisma.sensorData.deleteMany();
    await prisma.aIReport.deleteMany();

    // Mock AI response
    (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
      getGenerativeModel: () => ({
        generateContent: () => ({
          response: {
            text: () => `
              Plants are growing under optimal conditions.

              Recommendations:
              - Maintain current temperature
              - Increase watering frequency

              Alerts:
              - Light levels slightly below optimal range

              85
            `,
          },
        }),
      }),
    }));
  });

  describe('analyzePlantGrowth', () => {
    it('should analyze plant growth conditions', async () => {
      // Add test sensor data
      await prisma.sensorData.createMany({
        data: Array.from({ length: 24 }, (_, i) => ({
          gardenId,
          temperature: 25,
          humidity: 50,
          soilMoisture: 60,
          lightLevel: 900,
          recordedAt: new Date(Date.now() - i * 3600000), // Last 24 hours
        })),
      });

      const startDate = new Date(Date.now() - 24 * 3600000);
      const endDate = new Date();

      const analysis = await analyzePlantGrowth(
        gardenId,
        plantId,
        startDate,
        endDate
      );

      expect(analysis).toHaveProperty('summary');
      expect(analysis).toHaveProperty('recommendations');
      expect(analysis).toHaveProperty('alerts');
      expect(analysis).toHaveProperty('healthScore');
      expect(analysis.healthScore).toBe(85);

      // Verify report was saved
      const savedReport = await prisma.aIReport.findFirst({
        where: {
          gardenId,
          reportType: 'plant-growth',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      expect(savedReport).toBeDefined();
      expect(savedReport?.result).toEqual(analysis);
    });

    it('should handle missing data', async () => {
      const startDate = new Date();
      const endDate = new Date();

      await expect(
        analyzePlantGrowth(gardenId, plantId, startDate, endDate)
      ).rejects.toThrow('No data available for analysis');
    });
  });

  afterAll(async () => {
    await prisma.sensorData.deleteMany();
    await prisma.aIReport.deleteMany();
    await prisma.plantGarden.deleteMany();
    await prisma.plant.deleteMany();
    await prisma.garden.deleteMany();
    await prisma.user.deleteMany();
  });
}); 