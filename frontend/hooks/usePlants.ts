import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plant } from '@/types/plants';
import { api } from '@/lib/api';

export function usePlants() {
  return useQuery<Plant[]>({
    queryKey: ['plants'],
    queryFn: () => api.get('/plants').then((res) => res.data),
  });
}

export function useCreatePlant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (plant: Omit<Plant, 'id'>) =>
      api.post('/plants', plant).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plants'] });
    },
  });
}

export function useUpdatePlant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (plant: Plant) =>
      api.put(`/plants/${plant.id}`, plant).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plants'] });
    },
  });
}

export function useDeletePlant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (plantId: string) =>
      api.delete(`/plants/${plantId}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plants'] });
    },
  });
} 