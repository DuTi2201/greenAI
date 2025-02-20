import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { socket } from '@/lib/socket';
import { toast } from 'sonner';

interface DeviceState {
  pump1: boolean;
  pump2: boolean;
  led: boolean;
  fan: boolean;
}

interface SystemConfig {
  soil_moisture_threshold: number;
  nutrient_interval: number;
  nutrient_duration: number;
  water_pump_duration: number;
}

export const ControlPanel = () => {
  const [deviceState, setDeviceState] = useState<DeviceState>({
    pump1: false,
    pump2: false,
    led: false,
    fan: false
  });

  const [config, setConfig] = useState<SystemConfig>({
    soil_moisture_threshold: 500,
    nutrient_interval: 60000,
    nutrient_duration: 2000,
    water_pump_duration: 3000
  });

  useEffect(() => {
    // Lấy trạng thái thiết bị
    const fetchDeviceState = async () => {
      try {
        const response = await fetch('/api/wemos/control');
        const data = await response.json();
        setDeviceState(data);
      } catch (error) {
        console.error('Error fetching device state:', error);
        toast.error('Không thể lấy trạng thái thiết bị');
      }
    };

    // Lấy cấu hình hệ thống
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/wemos/config');
        const data = await response.json();
        setConfig(data);
      } catch (error) {
        console.error('Error fetching config:', error);
        toast.error('Không thể lấy cấu hình hệ thống');
      }
    };

    fetchDeviceState();
    fetchConfig();

    // Lắng nghe cập nhật từ server
    socket.on('device_update', (data: DeviceState) => {
      setDeviceState(data);
    });

    return () => {
      socket.off('device_update');
    };
  }, []);

  // Điều khiển thiết bị
  const handleDeviceControl = async (device: keyof DeviceState) => {
    try {
      const newState = { ...deviceState, [device]: !deviceState[device] };
      const response = await fetch('/api/devices/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device, state: newState[device] })
      });

      if (!response.ok) throw new Error('Lỗi điều khiển thiết bị');
      
      setDeviceState(newState);
      toast.success(`${device} ${newState[device] ? 'bật' : 'tắt'} thành công`);
    } catch (error) {
      console.error('Error controlling device:', error);
      toast.error('Không thể điều khiển thiết bị');
    }
  };

  // Cập nhật cấu hình
  const handleConfigUpdate = async () => {
    try {
      const response = await fetch('/api/wemos/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (!response.ok) throw new Error('Lỗi cập nhật cấu hình');
      
      toast.success('Cập nhật cấu hình thành công');
    } catch (error) {
      console.error('Error updating config:', error);
      toast.error('Không thể cập nhật cấu hình');
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Pump Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Điều khiển máy bơm</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Máy bơm nước</Label>
            <Switch
              checked={deviceState.pump1}
              onCheckedChange={() => handleDeviceControl('pump1')}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Máy bơm dung dịch</Label>
            <Switch
              checked={deviceState.pump2}
              onCheckedChange={() => handleDeviceControl('pump2')}
            />
          </div>
        </CardContent>
      </Card>

      {/* LED/Fan Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Điều khiển đèn & quạt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Đèn LED</Label>
            <Switch
              checked={deviceState.led}
              onCheckedChange={() => handleDeviceControl('led')}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Quạt</Label>
            <Switch
              checked={deviceState.fan}
              onCheckedChange={() => handleDeviceControl('fan')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Configuration Settings */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Cài đặt hệ thống</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Ngưỡng độ ẩm đất (0-1023)</Label>
              <Input
                type="number"
                value={config.soil_moisture_threshold}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  soil_moisture_threshold: parseInt(e.target.value)
                }))}
                min={0}
                max={1023}
              />
            </div>
            <div className="space-y-2">
              <Label>Chu kỳ bơm dung dịch (ms)</Label>
              <Input
                type="number"
                value={config.nutrient_interval}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  nutrient_interval: parseInt(e.target.value)
                }))}
                min={1000}
                max={3600000}
              />
            </div>
            <div className="space-y-2">
              <Label>Thời gian bơm dung dịch (ms)</Label>
              <Input
                type="number"
                value={config.nutrient_duration}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  nutrient_duration: parseInt(e.target.value)
                }))}
                min={100}
                max={10000}
              />
            </div>
            <div className="space-y-2">
              <Label>Thời gian bơm nước (ms)</Label>
              <Input
                type="number"
                value={config.water_pump_duration}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  water_pump_duration: parseInt(e.target.value)
                }))}
                min={100}
                max={10000}
              />
            </div>
          </div>
          <Button 
            className="w-full"
            onClick={handleConfigUpdate}
          >
            Cập nhật cấu hình
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}; 