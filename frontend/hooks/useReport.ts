"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  reportService,
  GenerateReportData,
  CreateScheduleData,
  UpdateScheduleData
} from '@/lib/services/report';

// Fix: Thêm query keys để quản lý cache
const QUERY_KEYS = {
  reports: (deviceId: string) => ['reports', deviceId],
  schedules: (deviceId: string) => ['schedules', deviceId]
};

export function useReport(deviceId?: string) {
  const queryClient = useQueryClient();

  // Fix: Cập nhật query để lấy danh sách báo cáo
  const {
    data: reports,
    isLoading: isLoadingReports,
    error: reportsError
  } = useQuery({
    queryKey: QUERY_KEYS.reports(deviceId || ''),
    queryFn: () => reportService.getReports(deviceId!),
    enabled: !!deviceId,
    refetchInterval: 30000 // Tự động cập nhật mỗi 30 giây
  });

  // Fix: Cập nhật query để lấy danh sách lịch trình
  const {
    data: schedules,
    isLoading: isLoadingSchedules,
    error: schedulesError
  } = useQuery({
    queryKey: QUERY_KEYS.schedules(deviceId || ''),
    queryFn: () => reportService.getSchedules(deviceId!),
    enabled: !!deviceId
  });

  // Fix: Cập nhật mutation để tạo báo cáo mới
  const generateReport = useMutation({
    mutationFn: ({ deviceId, data }: { deviceId: string; data: GenerateReportData }) =>
      reportService.generateReport(deviceId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reports(variables.deviceId) });
    }
  });

  // Fix: Cập nhật mutation để tạo lịch trình mới
  const createSchedule = useMutation({
    mutationFn: ({ deviceId, data }: { deviceId: string; data: CreateScheduleData }) =>
      reportService.createSchedule(deviceId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.schedules(variables.deviceId) });
    }
  });

  // Fix: Cập nhật mutation để cập nhật lịch trình
  const updateSchedule = useMutation({
    mutationFn: ({
      deviceId,
      scheduleId,
      data
    }: {
      deviceId: string;
      scheduleId: string;
      data: UpdateScheduleData;
    }) => reportService.updateSchedule(deviceId, scheduleId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.schedules(variables.deviceId) });
    }
  });

  // Fix: Cập nhật mutation để xóa lịch trình
  const deleteSchedule = useMutation({
    mutationFn: ({ deviceId, scheduleId }: { deviceId: string; scheduleId: string }) =>
      reportService.deleteSchedule(deviceId, scheduleId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.schedules(variables.deviceId) });
    }
  });

  return {
    // Queries
    reports,
    schedules,
    isLoading: isLoadingReports || isLoadingSchedules,
    error: reportsError || schedulesError,

    // Mutations
    generateReport: generateReport.mutate,
    createSchedule: createSchedule.mutate,
    updateSchedule: updateSchedule.mutate,
    deleteSchedule: deleteSchedule.mutate,

    // Mutation states
    isGenerating: generateReport.isPending,
    isCreatingSchedule: createSchedule.isPending,
    isUpdatingSchedule: updateSchedule.isPending,
    isDeletingSchedule: deleteSchedule.isPending
  };
} 