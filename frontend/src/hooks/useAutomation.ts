import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AutomationRule } from '@/types/garden';
import { api } from '@/lib/api';

export function useAutomationRules(gardenId: string) {
  return useQuery<AutomationRule[]>({
    queryKey: ['automation', 'rules', gardenId],
    queryFn: () => api.get(`/automation/rules/${gardenId}`).then((res) => res.data.rules),
    enabled: !!gardenId,
  });
}

export function useCreateAutomationRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rule: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt'>) =>
      api.post('/automation/rules', rule).then((res) => res.data.rule),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['automation', 'rules', variables.gardenId] });
    },
  });
}

export function useUpdateAutomationRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<AutomationRule>) =>
      api.put(`/automation/rules/${id}`, data).then((res) => res.data.rule),
    onSuccess: (_, variables) => {
      // Lấy gardenId từ cache để invalidate đúng query
      const queryClient = useQueryClient();
      const rule = queryClient.getQueryData<AutomationRule>(['automation', 'rule', variables.id]);
      if (rule?.gardenId) {
        queryClient.invalidateQueries({ queryKey: ['automation', 'rules', rule.gardenId] });
      }
    },
  });
}

export function useDeleteAutomationRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/automation/rules/${id}`).then(() => id),
    onSuccess: (_, id) => {
      // Lấy gardenId từ cache để invalidate đúng query
      const queryClient = useQueryClient();
      const rule = queryClient.getQueryData<AutomationRule>(['automation', 'rule', id]);
      if (rule?.gardenId) {
        queryClient.invalidateQueries({ queryKey: ['automation', 'rules', rule.gardenId] });
      }
    },
  });
} 