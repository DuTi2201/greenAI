import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const WemosConfig = () => {
  const [serverUrl, setServerUrl] = useState('');
  const [controlUrl, setControlUrl] = useState('');
  const [wifiStatus, setWifiStatus] = useState({
    ssid: '',
    ip: '',
    rssi: 0,
    isConnected: false
  });

  useEffect(() => {
    // Lấy thông tin cấu hình hiện tại
    const fetchConfig = async () => {
      try {
        const response = await fetch(`${API_URL}/wemos/config`);
        if (!response.ok) throw new Error('Không thể lấy cấu hình');
        const data = await response.json();
        setServerUrl(data.serverUrl || '');
        setControlUrl(data.controlUrl || '');
      } catch (error) {
        console.error('Lỗi khi lấy cấu hình:', error);
        toast.error('Không thể lấy cấu hình Wemos');
      }
    };

    // Lấy trạng thái kết nối
    const fetchStatus = async () => {
      try {
        const response = await fetch(`${API_URL}/wemos/status`);
        if (!response.ok) throw new Error('Không thể lấy trạng thái');
        const data = await response.json();
        setWifiStatus(data);
      } catch (error) {
        console.error('Lỗi khi lấy trạng thái:', error);
      }
    };

    fetchConfig();
    fetchStatus();

    // Cập nhật trạng thái mỗi 5 giây
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveConfig = async () => {
    try {
      const response = await fetch(`${API_URL}/wemos/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serverUrl,
          controlUrl,
        }),
      });

      if (!response.ok) throw new Error('Lỗi khi lưu cấu hình');
      
      toast.success('Đã lưu cấu hình thành công');
    } catch (error) {
      console.error('Lỗi khi lưu cấu hình:', error);
      toast.error('Không thể lưu cấu hình');
    }
  };

  const handleResetWifi = async () => {
    try {
      const response = await fetch(`${API_URL}/wemos/reset-wifi`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Lỗi khi reset WiFi');
      
      toast.success('Đã reset WiFi thành công');
    } catch (error) {
      console.error('Lỗi khi reset WiFi:', error);
      toast.error('Không thể reset WiFi');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cấu hình Wemos D1</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="config">
          <TabsList>
            <TabsTrigger value="config">Cấu hình</TabsTrigger>
            <TabsTrigger value="status">Trạng thái</TabsTrigger>
            <TabsTrigger value="wifi">WiFi</TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="serverUrl">Server URL</Label>
              <Input
                id="serverUrl"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="http://your-server.com/api/data"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="controlUrl">Control URL</Label>
              <Input
                id="controlUrl"
                value={controlUrl}
                onChange={(e) => setControlUrl(e.target.value)}
                placeholder="http://your-server.com/api/control"
              />
            </div>
            <Button onClick={handleSaveConfig}>Lưu cấu hình</Button>
          </TabsContent>

          <TabsContent value="status">
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  {wifiStatus.isConnected ? (
                    <>
                      <p>✅ Đã kết nối</p>
                      <p>SSID: {wifiStatus.ssid}</p>
                      <p>IP: {wifiStatus.ip}</p>
                      <p>Cường độ tín hiệu: {wifiStatus.rssi} dBm</p>
                    </>
                  ) : (
                    <p>❌ Chưa kết nối</p>
                  )}
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>

          <TabsContent value="wifi" className="space-y-4">
            <Alert>
              <AlertDescription>
                Để cấu hình WiFi mới, hãy kết nối với mạng WiFi &quot;ESP8266-ConfigAP&quot; 
                và truy cập địa chỉ 192.168.4.1 trên trình duyệt.
              </AlertDescription>
            </Alert>
            <Button onClick={handleResetWifi} variant="destructive">
              Reset WiFi
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}; 