import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface GrowthData {
  recordedAt: string;
  temperature: number;
  humidity: number;
  soilMoisture: number;
  lightLevel: number;
}

export function usePlantGrowthData(
  gardenId: string,
  plantId: string,
  startDate: Date,
  endDate: Date
) {
  return useQuery<GrowthData[]>({
    queryKey: ['plant-growth', gardenId, plantId, startDate, endDate],
    queryFn: async () => {
      const { data } = await api.get(`/gardens/${gardenId}/plants/${plantId}/growth`, {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });
      return data;
    },
  });
} 