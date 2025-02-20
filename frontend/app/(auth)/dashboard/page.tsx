"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { sensorService } from "@/lib/services/sensor.service"
import { deviceService } from "@/lib/services/device.service"
import { Thermometer, Droplet, Sun, Cloud, FlaskConical } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { SensorDisplay } from "@/components/dashboard/SensorDisplay"
import { DeviceType } from '@/types/device'

export default function DashboardPage() {
  const queryClient = useQueryClient()

  const { data: sensorData, isLoading: isLoadingSensor } = useQuery({
    queryKey: ['sensorData'],
    queryFn: () => sensorService.getLatest(),
    refetchInterval: 5000,
  })

  const { data: devices, isLoading: isLoadingDevices } = useQuery({
    queryKey: ['devices'],
    queryFn: () => deviceService.getAll(),
    refetchInterval: 5000,
  })

  const { data: sensorHistory } = useQuery({
    queryKey: ['sensorHistory'],
    queryFn: () => sensorService.getHistory(24), // Lấy 24 bản ghi gần nhất
    refetchInterval: 5000,
  })

  // Mutation để cập nhật trạng thái thiết bị
  const controlMutation = useMutation({
    mutationFn: ({ deviceId, action }: { deviceId: string; action: 'on' | 'off' }) =>
      deviceService.control(deviceId, action),
    onSuccess: () => {
      // Cập nhật lại danh sách thiết bị sau khi mutation thành công
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      toast.success('Đã cập nhật trạng thái thiết bị')
    },
    onError: (error) => {
      console.error('Lỗi khi điều khiển thiết bị:', error)
      toast.error('Không thể cập nhật trạng thái thiết bị')
    },
  })

  // Format dữ liệu cho biểu đồ
  const chartData = sensorHistory?.map(data => ({
    time: new Date(data.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    temperature: data.temperature,
    humidity: data.humidity,
    soilMoisture: data.soilMoisture,
    light: data.light,
  })) || []

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Sensor Display Component */}
      <SensorDisplay />

      {/* Sensor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-[#E57373] text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm opacity-80">Air Temperature</p>
              <p className="text-3xl font-bold">{sensorData?.temperature.toFixed(1)}°C</p>
            </div>
            <Thermometer className="h-8 w-8 opacity-80" />
          </div>
        </Card>

        <Card className="p-4 bg-[#64B5F6] text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm opacity-80">Soil Moisture</p>
              <p className="text-3xl font-bold">{Math.round((sensorData?.soilMoisture || 0) / 1023 * 100)}%</p>
            </div>
            <Droplet className="h-8 w-8 opacity-80" />
          </div>
        </Card>

        <Card className="p-4 bg-[#FFB74D] text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm opacity-80">Light Intensity</p>
              <p className="text-3xl font-bold">{Math.round((sensorData?.light || 0) / 1023 * 100)}%</p>
            </div>
            <Sun className="h-8 w-8 opacity-80" />
          </div>
        </Card>

        <Card className="p-4 bg-[#9575CD] text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm opacity-80">Air Humidity</p>
              <p className="text-3xl font-bold">{sensorData?.humidity.toFixed(1)}%</p>
            </div>
            <Cloud className="h-8 w-8 opacity-80" />
          </div>
        </Card>
      </div>

      {/* Sensor History Chart */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Sensor History</h2>
          <Tabs defaultValue="day">
            <TabsList>
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#E57373" name="Temperature (°C)" dot={false} />
              <Line yAxisId="left" type="monotone" dataKey="soilMoisture" stroke="#64B5F6" name="Soil Moisture (%)" dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="light" stroke="#FFB74D" name="Light (Lux)" dot={false} />
              <Line yAxisId="left" type="monotone" dataKey="humidity" stroke="#9575CD" name="Humidity (%)" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Device Status */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Device Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {devices?.map(device => (
            device.type !== 'sensor' && (
              <div key={device.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                <div className="flex items-center space-x-3">
                  {device.type === DeviceType.WATER_PUMP && <Droplet className="h-5 w-5 text-red-500" />}
                  {device.type === DeviceType.LED && <Sun className="h-5 w-5 text-yellow-500" />}
                  {device.type === DeviceType.FAN && <Cloud className="h-5 w-5 text-blue-500" />}
                  {device.type === DeviceType.NUTRIENT_PUMP && <FlaskConical className="h-5 w-5 text-purple-500" />}
                  <span className="text-sm font-medium">{device.name}</span>
                </div>
                <div className="flex items-center">
                  <Switch
                    checked={device.status === 'on'}
                    onCheckedChange={(checked) => {
                      controlMutation.mutate({
                        deviceId: device.id,
                        action: checked ? 'on' : 'off',
                      })
                    }}
                    disabled={!device.isActive || controlMutation.isPending}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>
              </div>
            )
          ))}
        </div>
      </Card>
    </div>
  )
} 