interface DeviceAction {
  device: string
  action: 'on' | 'off'
  duration?: number
}

class DevicesService {
  // TODO: Thay thế bằng tích hợp thực tế với phần cứng IoT
  async controlDevice(action: DeviceAction) {
    try {
      console.log(`Controlling device: ${action.device}`)
      console.log(`Action: ${action.action}`)
      if (action.duration) {
        console.log(`Duration: ${action.duration} seconds`)
        
        // Giả lập tắt thiết bị sau khoảng thời gian duration
        setTimeout(() => {
          console.log(`Auto turning off ${action.device} after ${action.duration} seconds`)
        }, action.duration * 1000)
      }

      // Giả lập gửi lệnh đến thiết bị
      await new Promise(resolve => setTimeout(resolve, 500))

      return {
        success: true,
        device: action.device,
        status: action.action,
      }
    } catch (error) {
      console.error(`Error controlling device ${action.device}:`, error)
      throw error
    }
  }

  async getDeviceStatus(deviceId: string) {
    try {
      // TODO: Implement getting real device status
      return {
        device: deviceId,
        status: Math.random() > 0.5 ? 'on' : 'off',
        lastUpdate: new Date().toISOString(),
      }
    } catch (error) {
      console.error(`Error getting device status for ${deviceId}:`, error)
      throw error
    }
  }
}

export const devicesService = new DevicesService() 