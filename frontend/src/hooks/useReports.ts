import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AIReport, ReportSchedule } from '@/types/reports';
import { api } from '@/lib/api';

export function useReports(gardenId: string) {
  return useQuery<AIReport[]>({
    queryKey: ['reports', gardenId],
    queryFn: () => api.get(`/reports/${gardenId}`).then((res) => res.data.reports),
    enabled: !!gardenId,
  });
}

export function useGenerateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      gardenId, 
      reportType, 
      startDate, 
      endDate 
    }: { 
      gardenId: string; 
      reportType: string; 
      startDate: Date; 
      endDate: Date 
    }) =>
      api.post(`/reports/${gardenId}`, {
        reportType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }).then((res) => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reports', variables.gardenId] });
    },
  });
}

export function useReportSchedules(gardenId: string) {
  return useQuery<ReportSchedule[]>({
    queryKey: ['report-schedules', gardenId],
    queryFn: () => api.get(`/reports/${gardenId}/schedules`).then((res) => res.data.schedules),
    enabled: !!gardenId,
  });
}

export function useCreateReportSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (schedule: {
      gardenId: string;
      frequency: string;
      dayOfWeek?: number;
      timeOfDay: Date;
      emailRecipient: string;
      reportType: string;
    }) =>
      api.post(`/reports/${schedule.gardenId}/schedules`, {
        ...schedule,
        timeOfDay: schedule.timeOfDay.toISOString(),
      }).then((res) => res.data.schedule),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['report-schedules', variables.gardenId] });
    },
  });
}

export function useUpdateReportSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      gardenId, 
      scheduleId, 
      ...data 
    }: { 
      gardenId: string; 
      scheduleId: string;
      frequency?: string;
      dayOfWeek?: number;
      timeOfDay?: Date;
      emailRecipient?: string;
      reportType?: string;
      isActive?: boolean;
    }) => {
      const payload = { ...data };
      if (data.timeOfDay) {
        payload.timeOfDay = data.timeOfDay.toISOString();
      }
      return api.patch(`/reports/${gardenId}/schedules/${scheduleId}`, payload)
        .then((res) => res.data.schedule);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['report-schedules', variables.gardenId] });
    },
  });
}

export function useDeleteReportSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ gardenId, scheduleId }: { gardenId: string; scheduleId: string }) =>
      api.delete(`/reports/${gardenId}/schedules/${scheduleId}`).then(() => ({ gardenId, scheduleId })),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['report-schedules', variables.gardenId] });
    },
  });
} 