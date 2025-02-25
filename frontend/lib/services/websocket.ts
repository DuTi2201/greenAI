import { io, Socket } from 'socket.io-client';
import { authService } from './auth';
import { SensorData, DeviceStatus } from './device';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

class WebSocketService {
  private socket: Socket | null = null;
  private deviceSubscriptions: Map<string, Set<(data: any) => void>> = new Map();

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(WS_URL, {
      auth: {
        token: authService.getToken()
      }
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('error', (error: string) => {
      console.warn('WebSocket error:', error);
    });

    // Handle sensor updates
    this.socket.on('sensor-update', (data: SensorData) => {
      const deviceId = data.id;
      const callbacks = this.deviceSubscriptions.get(`sensor:${deviceId}`);
      if (callbacks) {
        callbacks.forEach(callback => callback(data));
      }
    });

    // Handle device control updates
    this.socket.on('control-update', (data: DeviceStatus) => {
      const deviceId = data.id;
      const callbacks = this.deviceSubscriptions.get(`control:${deviceId}`);
      if (callbacks) {
        callbacks.forEach(callback => callback(data));
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.deviceSubscriptions.clear();
  }

  subscribeToSensorUpdates(deviceId: string, callback: (data: SensorData) => void) {
    if (!this.socket?.connected) {
      this.connect();
    }

    const key = `sensor:${deviceId}`;
    if (!this.deviceSubscriptions.has(key)) {
      this.deviceSubscriptions.set(key, new Set());
      this.socket?.emit('join-device', deviceId);
    }

    this.deviceSubscriptions.get(key)?.add(callback);
  }

  unsubscribeFromSensorUpdates(deviceId: string, callback: (data: SensorData) => void) {
    const key = `sensor:${deviceId}`;
    const callbacks = this.deviceSubscriptions.get(key);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.deviceSubscriptions.delete(key);
        this.socket?.emit('leave-device', deviceId);
      }
    }
  }

  subscribeToControlUpdates(deviceId: string, callback: (data: DeviceStatus) => void) {
    if (!this.socket?.connected) {
      this.connect();
    }

    const key = `control:${deviceId}`;
    if (!this.deviceSubscriptions.has(key)) {
      this.deviceSubscriptions.set(key, new Set());
      this.socket?.emit('join-device', deviceId);
    }

    this.deviceSubscriptions.get(key)?.add(callback);
  }

  unsubscribeFromControlUpdates(deviceId: string, callback: (data: DeviceStatus) => void) {
    const key = `control:${deviceId}`;
    const callbacks = this.deviceSubscriptions.get(key);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.deviceSubscriptions.delete(key);
        this.socket?.emit('leave-device', deviceId);
      }
    }
  }

  sendSensorData(data: Omit<SensorData, 'id' | 'recordedAt'> & { deviceId: string }) {
    this.socket?.emit('sensor-data', data);
  }

  sendControlCommand(data: Omit<DeviceStatus, 'id' | 'updatedAt'> & { deviceId: string }) {
    this.socket?.emit('device-control', data);
  }
}

export const wsService = new WebSocketService(); 