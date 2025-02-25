import axios from 'axios';
import { authService } from './auth';
import { api } from '../api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface Device {
  id: string;
  wemosSerial: string;
  name: string;
  location?: string;
  status: string;
  lastConnected?: Date;
  deviceStatus?: DeviceStatus[];
  sensorData?: SensorData[];
  automationRules?: AutomationRule[];
  firmwareVersion?: string;
}

export interface DeviceStatus {
  id: string;
  fanStatus: boolean;
  ledStatus: boolean;
  nutrientPumpStatus: boolean;
  waterPumpStatus: boolean;
  updatedAt: Date;
}

export interface SensorData {
  id: string;
  temperature?: number;
  humidity?: number;
  soilMoisture?: number;
  lightLevel?: number;
  recordedAt: Date;
}

export interface AutomationRule {
  id: string;
  sensorType: string;
  conditionOperator: string;
  thresholdValue: number;
  actionDevice: string;
  actionStatus: boolean;
  isActive: boolean;
}

export interface CreateDeviceData {
  wemosSerial: string;
  name: string;
  location?: string;
}

export interface UpdateDeviceData {
  name?: string;
  location?: string;
  status?: string;
}

export interface DeviceControlData {
  fanStatus?: boolean;
  ledStatus?: boolean;
  nutrientPumpStatus?: boolean;
  waterPumpStatus?: boolean;
}

export class DeviceService {
  private getHeaders() {
    const token = authService.getToken();
    if (!token) {
      console.warn('No authentication token found');
    }
    return {
      Authorization: token ? `Bearer ${token}` : ''
    };
  }

  async getAllDevices(): Promise<Device[]> {
    try {
      const response = await axios.get(`${API_URL}/devices`, {
        headers: this.getHeaders(),
        params: { _t: new Date().getTime() }
      });
      return response.data.data.devices;
    } catch (error: any) {
      if (error.response?.status === 401) {
        return [];
      }
      
      console.warn('Không thể lấy danh sách thiết bị');
      throw error;
    }
  }

  async getDevice(id: string): Promise<Device> {
    try {
      const response = await axios.get(`${API_URL}/devices/${id}`, {
        headers: this.getHeaders()
      });
      return response.data.data.device;
    } catch (error) {
      console.error('Get device error:', error);
      throw error;
    }
  }

  async createDevice(data: CreateDeviceData): Promise<Device> {
    try {
      const response = await axios.post(`${API_URL}/devices`, data, {
        headers: this.getHeaders()
      });
      return response.data.data.device;
    } catch (error) {
      console.error('Create device error:', error);
      throw error;
    }
  }

  async updateDevice(id: string, data: UpdateDeviceData): Promise<Device> {
    try {
      const response = await axios.patch(`${API_URL}/devices/${id}`, data, {
        headers: this.getHeaders()
      });
      return response.data.data.device;
    } catch (error) {
      console.error('Update device error:', error);
      throw error;
    }
  }

  async deleteDevice(id: string): Promise<void> {
    try {
      await axios.delete(`${API_URL}/devices/${id}`, {
        headers: this.getHeaders()
      });
    } catch (error) {
      console.error('Delete device error:', error);
      throw error;
    }
  }

  async controlDevice(id: string, data: DeviceControlData): Promise<DeviceStatus> {
    try {
      const response = await axios.post(`${API_URL}/devices/${id}/control`, data, {
        headers: this.getHeaders()
      });
      return response.data.data.deviceStatus;
    } catch (error) {
      console.error('Control device error:', error);
      throw error;
    }
  }

  async getSensorData(
    deviceId: string,
    from?: Date,
    to?: Date,
    limit?: number
  ): Promise<SensorData[]> {
    try {
      const params = new URLSearchParams();
      if (from) params.append('from', from.toISOString());
      if (to) params.append('to', to.toISOString());
      if (limit) params.append('limit', limit.toString());

      const response = await axios.get(`${API_URL}/sensors/${deviceId}`, {
        headers: this.getHeaders(),
        params
      });
      return response.data.data.sensorData;
    } catch (error) {
      console.error('Get sensor data error:', error);
      throw error;
    }
  }

  async getAutomationRules(deviceId: string): Promise<AutomationRule[]> {
    try {
      const response = await axios.get(`${API_URL}/automation/${deviceId}`, {
        headers: this.getHeaders()
      });
      return response.data.data.rules;
    } catch (error) {
      console.error('Get automation rules error:', error);
      throw error;
    }
  }

  async createAutomationRule(
    deviceId: string,
    rule: Omit<AutomationRule, 'id' | 'isActive'>
  ): Promise<AutomationRule> {
    try {
      const response = await axios.post(`${API_URL}/automation/${deviceId}`, rule, {
        headers: this.getHeaders()
      });
      return response.data.data.rule;
    } catch (error) {
      console.error('Create automation rule error:', error);
      throw error;
    }
  }

  async updateAutomationRule(
    deviceId: string,
    ruleId: string,
    data: Partial<AutomationRule>
  ): Promise<AutomationRule> {
    try {
      const response = await axios.patch(
        `${API_URL}/automation/${deviceId}/rules/${ruleId}`,
        data,
        {
          headers: this.getHeaders()
        }
      );
      return response.data.data.rule;
    } catch (error) {
      console.error('Update automation rule error:', error);
      throw error;
    }
  }

  async deleteAutomationRule(deviceId: string, ruleId: string): Promise<void> {
    try {
      await axios.delete(`${API_URL}/automation/${deviceId}/rules/${ruleId}`, {
        headers: this.getHeaders()
      });
    } catch (error) {
      console.error('Delete automation rule error:', error);
      throw error;
    }
  }
}

const deviceServiceInstance = new DeviceService();

/**
 * Tạo quy tắc tự động hóa mới
 * @param gardenId ID của vườn
 * @param data Dữ liệu quy tắc
 * @returns Quy tắc đã tạo
 */
export const createAutomationRule = async (gardenId: string, data: any) => {
  const response = await api.post('/automation/rules', {
    ...data,
    gardenId
  });
  return response.data;
};

/**
 * Cập nhật quy tắc tự động hóa
 * @param ruleId ID của quy tắc
 * @param data Dữ liệu cập nhật
 * @returns Quy tắc đã cập nhật
 */
export const updateAutomationRule = async (ruleId: string, data: any) => {
  const response = await api.put(`/automation/rules/${ruleId}`, data);
  return response.data;
};

/**
 * Xóa quy tắc tự động hóa
 * @param ruleId ID của quy tắc
 */
export const deleteAutomationRule = async (ruleId: string) => {
  await api.delete(`/automation/rules/${ruleId}`);
};

/**
 * Lấy danh sách quy tắc tự động hóa của vườn
 * @param gardenId ID của vườn
 * @returns Danh sách quy tắc
 */
export const getAutomationRules = async (gardenId: string) => {
  const response = await api.get(`/automation/rules/${gardenId}`);
  return response.data;
};

/**
 * Kiểm tra xung đột giữa các quy tắc
 * @param gardenId ID của vườn
 * @returns Thông tin xung đột
 */
export const checkRuleConflicts = async (gardenId: string) => {
  const response = await api.get(`/automation/rules/${gardenId}/conflicts`);
  return response.data;
};

export const deviceService = {
  getAllDevices: deviceServiceInstance.getAllDevices.bind(deviceServiceInstance),
  getDevice: deviceServiceInstance.getDevice.bind(deviceServiceInstance),
  createDevice: deviceServiceInstance.createDevice.bind(deviceServiceInstance),
  updateDevice: deviceServiceInstance.updateDevice.bind(deviceServiceInstance),
  deleteDevice: deviceServiceInstance.deleteDevice.bind(deviceServiceInstance),
  controlDevice: deviceServiceInstance.controlDevice.bind(deviceServiceInstance),
  getSensorData: deviceServiceInstance.getSensorData.bind(deviceServiceInstance),
  createAutomationRule,
  updateAutomationRule,
  deleteAutomationRule,
  getAutomationRules,
  checkRuleConflicts,
}; 