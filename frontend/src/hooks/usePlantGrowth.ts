import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface GrowthData {
  recordedAt: string;
  temperature: number;
  humidity: number;
  soilMoisture: number;
  lightLevel: number;
}

interface GrowthAnalysis {
  summary: string;
  recommendations: string[];
  alerts: string[];
  healthScore: number;
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
    enabled: !!gardenId && !!plantId && !!startDate && !!endDate,
  });
}

export function useAnalyzePlantGrowth() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      gardenId, 
      plantId, 
      startDate, 
      endDate 
    }: { 
      gardenId: string; 
      plantId: string; 
      startDate: Date; 
      endDate: Date 
    }) =>
      api.post(`/ai/analyze-plant-growth`, {
        gardenId,
        plantId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }).then((res) => res.data as GrowthAnalysis),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reports', variables.gardenId] });
    },
  });
} 