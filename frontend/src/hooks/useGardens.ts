import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Garden } from '@/types/garden';
import { api } from '@/lib/api';

export function useGardens() {
  return useQuery<Garden[]>({
    queryKey: ['gardens'],
    queryFn: () => api.get('/gardens').then((res) => res.data),
  });
}

export function useGarden(id: string) {
  return useQuery<Garden>({
    queryKey: ['gardens', id],
    queryFn: () => api.get(`/gardens/${id}`).then((res) => res.data),
    enabled: !!id,
  });
}

export function useCreateGarden() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (garden: Omit<Garden, 'id' | 'userId' | 'apiKey' | 'createdAt' | 'updatedAt'>) =>
      api.post('/gardens', garden).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gardens'] });
    },
  });
}

export function useUpdateGarden() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Garden>) =>
      api.put(`/gardens/${id}`, data).then((res) => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['gardens'] });
      queryClient.invalidateQueries({ queryKey: ['gardens', variables.id] });
    },
  });
}

export function useDeleteGarden() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/gardens/${id}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gardens'] });
    },
  });
}

export function useGardenSensorData(gardenId: string, params?: { from?: Date; to?: Date; limit?: number; page?: number }) {
  return useQuery({
    queryKey: ['gardens', gardenId, 'sensor-data', params],
    queryFn: () => {
      const queryParams = new URLSearchParams();
      if (params?.from) queryParams.append('from', params.from.toISOString());
      if (params?.to) queryParams.append('to', params.to.toISOString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.page) queryParams.append('page', params.page.toString());

      return api.get(`/gardens/${gardenId}/sensor-data?${queryParams}`).then((res) => res.data);
    },
    enabled: !!gardenId,
  });
}

export function useAddSensorData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ gardenId, ...data }: { 
      gardenId: string; 
      temperature: number; 
      humidity: number; 
      soilMoisture: number; 
      lightLevel: number 
    }) =>
      api.post(`/gardens/${gardenId}/sensor-data`, data).then((res) => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['gardens', variables.gardenId, 'sensor-data'] });
      queryClient.invalidateQueries({ queryKey: ['gardens', variables.gardenId] });
    },
  });
}

export function useUpdateDeviceStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ gardenId, ...data }: { 
      gardenId: string; 
      fanStatus?: boolean; 
      ledStatus?: boolean; 
      nutrientPumpStatus?: boolean; 
      waterPumpStatus?: boolean 
    }) =>
      api.put(`/gardens/${gardenId}/device-status`, data).then((res) => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['gardens', variables.gardenId] });
    },
  });
} 