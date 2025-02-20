import sequelize from '../config/database';
import { Device } from '../models/Device';
import { Setting } from '../models/Setting';

interface WemosConfig {
  serverUrl: string;
  controlUrl: string;
}

interface WemosStatus {
  ssid: string;
  ip: string;
  rssi: number;
  isConnected: boolean;
}

export class WemosService {
  async getConfig(): Promise<WemosConfig> {
    const config = await Setting.findOne({
      where: { key: 'wemos_config' }
    });

    if (!config) {
      return {
        serverUrl: '',
        controlUrl: ''
      };
    }

    return JSON.parse(config.value);
  }

  async updateConfig(config: WemosConfig): Promise<WemosConfig> {
    await Setting.upsert({
      key: 'wemos_config',
      value: JSON.stringify(config)
    });

    return config;
  }

  async getStatus(): Promise<WemosStatus> {
    const device = await Device.findOne({
      where: { type: 'sensor' }
    });

    if (!device || !device.metadata) {
      return {
        ssid: '',
        ip: '',
        rssi: 0,
        isConnected: false
      };
    }

    const metadata = device.metadata as any;
    return {
      ssid: metadata.ssid || '',
      ip: metadata.ip || '',
      rssi: metadata.rssi || 0,
      isConnected: device.isActive || false
    };
  }

  async resetWifi(): Promise<void> {
    const device = await Device.findOne({
      where: { type: 'sensor' }
    });

    if (!device) {
      throw new Error('Không tìm thấy thiết bị Wemos');
    }

    // TODO: Implement MQTT/WebSocket để gửi lệnh reset WiFi đến Wemos
    // Ví dụ:
    // await mqtt.publish('wemos/command', 'reset_wifi');
  }
} 