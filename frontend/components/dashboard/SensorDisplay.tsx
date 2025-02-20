import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { socket } from '@/lib/socket';
import { SensorData } from '@/types/sensor';

export const SensorDisplay = () => {
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [latestData, setLatestData] = useState<SensorData | null>(null);

  useEffect(() => {
    // Lấy dữ liệu lịch sử
    const fetchHistoricalData = async () => {
      try {
        const response = await fetch('/api/sensors/history');
        const data = await response.json();
        setSensorData(data);
        if (data.length > 0) {
          setLatestData(data[0]);
        }
      } catch (error) {
        console.error('Error fetching sensor data:', error);
      }
    };

    fetchHistoricalData();

    // Lắng nghe cập nhật realtime
    socket.on('sensor_update', (data: SensorData) => {
      setLatestData(data);
      setSensorData(prev => [data, ...prev].slice(0, 50));
    });

    return () => {
      socket.off('sensor_update');
    };
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Temperature & Humidity Chart */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Nhiệt độ & Độ ẩm</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sensorData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(time) => new Date(time).toLocaleTimeString()}
                />
                <YAxis yAxisId="temp" orientation="left" />
                <YAxis yAxisId="humidity" orientation="right" />
                <Tooltip 
                  labelFormatter={(label) => new Date(label).toLocaleString()}
                />
                <Line
                  yAxisId="temp"
                  type="monotone"
                  dataKey="temperature"
                  stroke="#ff7300"
                  name="Nhiệt độ (°C)"
                />
                <Line
                  yAxisId="humidity"
                  type="monotone"
                  dataKey="humidity"
                  stroke="#387908"
                  name="Độ ẩm (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Soil Moisture Gauge */}
      <Card>
        <CardHeader>
          <CardTitle>Độ ẩm đất</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-48 h-48 mx-auto">
            <CircularProgressbar
              value={latestData?.soilMoisture || 0}
              maxValue={1023}
              text={`${Math.round((latestData?.soilMoisture || 0) / 1023 * 100)}%`}
              styles={buildStyles({
                pathColor: `rgba(62, 152, 199, ${(latestData?.soilMoisture || 0) / 1023})`,
                textColor: '#075985',
                trailColor: '#d6d6d6',
              })}
            />
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Trạng thái máy bơm: {latestData?.waterPumpState ? 'Đang chạy' : 'Đã tắt'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Light Intensity Indicator */}
      <Card>
        <CardHeader>
          <CardTitle>Cường độ ánh sáng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-48 h-48 mx-auto">
            <CircularProgressbar
              value={latestData?.light || 0}
              maxValue={1023}
              text={`${Math.round((latestData?.light || 0) / 1023 * 100)}%`}
              styles={buildStyles({
                pathColor: `rgba(255, 177, 66, ${(latestData?.light || 0) / 1023})`,
                textColor: '#b45309',
                trailColor: '#d6d6d6',
              })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 