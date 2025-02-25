"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  deviceService,
  Device,
  CreateDeviceData,
  UpdateDeviceData,
  DeviceControlData,
  SensorData
} from '@/lib/services/device';
import { wsService } from '@/lib/services/websocket';
import { useEffect } from 'react';

// Fix: Thêm query keys để quản lý cache
const QUERY_KEYS = {
  devices: 'devices',
  device: (id: string) => ['device', id],
  sensorData: (id: string) => ['sensorData', id],
  automationRules: (id: string) => ['automationRules', id]
};

export function useDevice(deviceId?: string) {
  const queryClient = useQueryClient();

  // Fix: Cập nhật query để sử dụng deviceService
  const {
    data: devices,
    isLoading: isLoadingDevices,
    error: devicesError
  } = useQuery({
    queryKey: [QUERY_KEYS.devices],
    queryFn: () => deviceService.getAllDevices(),
    enabled: !deviceId // Chỉ fetch khi không có deviceId
  });

  // Fix: Cập nhật query để lấy thông tin thiết bị cụ thể
  const {
    data: device,
    isLoading: isLoadingDevice,
    error: deviceError
  } = useQuery({
    queryKey: QUERY_KEYS.device(deviceId || ''),
    queryFn: () => deviceService.getDevice(deviceId!),
    enabled: !!deviceId // Chỉ fetch khi có deviceId
  });

  // Fix: Cập nhật query để lấy dữ liệu cảm biến
  const {
    data: sensorData,
    isLoading: isLoadingSensorData,
    error: sensorDataError
  } = useQuery({
    queryKey: QUERY_KEYS.sensorData(deviceId || ''),
    queryFn: () => deviceService.getSensorData(deviceId!),
    enabled: !!deviceId,
    refetchInterval: 5000 // Tự động cập nhật mỗi 5 giây
  });

  // Fix: Cập nhật mutation để tạo thiết bị mới
  const createDevice = useMutation({
    mutationFn: (data: CreateDeviceData) => deviceService.createDevice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.devices] });
    }
  });

  // Fix: Cập nhật mutation để cập nhật thiết bị
  const updateDevice = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDeviceData }) =>
      deviceService.updateDevice(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.devices] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.device(variables.id) });
    }
  });

  // Fix: Cập nhật mutation để xóa thiết bị
  const deleteDevice = useMutation({
    mutationFn: (id: string) => deviceService.deleteDevice(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.devices] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.device(id) });
    }
  });

  // Fix: Cập nhật mutation để điều khiển thiết bị
  const controlDevice = useMutation({
    mutationFn: ({ id, data }: { id: string; data: DeviceControlData }) =>
      deviceService.controlDevice(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.device(variables.id) });
    }
  });

  // Fix: Cập nhật WebSocket subscriptions để nhận dữ liệu realtime
  useEffect(() => {
    if (!deviceId) return;

    const handleSensorUpdate = (data: SensorData) => {
      queryClient.setQueryData(QUERY_KEYS.sensorData(deviceId), (old: SensorData[] | undefined) => {
        if (!old) return [data];
        return [data, ...old.slice(0, 99)]; // Giữ 100 bản ghi gần nhất
      });
    };

    const handleControlUpdate = () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.device(deviceId) });
    };

    wsService.subscribeToSensorUpdates(deviceId, handleSensorUpdate);
    wsService.subscribeToControlUpdates(deviceId, handleControlUpdate);

    return () => {
      wsService.unsubscribeFromSensorUpdates(deviceId, handleSensorUpdate);
      wsService.unsubscribeFromControlUpdates(deviceId, handleControlUpdate);
    };
  }, [deviceId, queryClient]);

  return {
    // Queries
    devices,
    device,
    sensorData,
    isLoading: isLoadingDevices || isLoadingDevice || isLoadingSensorData,
    error: devicesError || deviceError || sensorDataError,

    // Mutations
    createDevice: createDevice.mutate,
    updateDevice: updateDevice.mutate,
    deleteDevice: deleteDevice.mutate,
    controlDevice: controlDevice.mutate,

    // Mutation states
    isCreating: createDevice.isPending,
    isUpdating: updateDevice.isPending,
    isDeleting: deleteDevice.isPending,
    isControlling: controlDevice.isPending
  };
}