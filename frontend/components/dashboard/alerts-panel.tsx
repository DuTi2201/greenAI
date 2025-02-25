"use client"

import { useLanguage } from "@/providers/language-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useGarden } from "@/contexts/garden-context"
import { useQuery } from "@tanstack/react-query"
import { deviceService } from "@/lib/services/device"
import { AlertTriangle, Thermometer, Droplets, Flower, Sun, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { vi, enUS } from "date-fns/locale"

const translations = {
  en: {
    title: "Recent Alerts",
    noAlerts: "No alerts found",
    loading: "Loading alerts...",
    temperature: "Temperature",
    humidity: "Humidity",
    soilMoisture: "Soil Moisture",
    light: "Light",
    high: "High",
    low: "Low",
    ago: "ago",
  },
  vi: {
    title: "Cảnh báo Gần đây",
    noAlerts: "Không có cảnh báo nào",
    loading: "Đang tải cảnh báo...",
    temperature: "Nhiệt độ",
    humidity: "Độ ẩm",
    soilMoisture: "Độ ẩm đất",
    light: "Ánh sáng",
    high: "Cao",
    low: "Thấp",
    ago: "trước",
  },
}

type AlertType = "temperature" | "humidity" | "soilMoisture" | "light"
type AlertSeverity = "high" | "low"

interface Alert {
  id: string
  type: AlertType
  severity: AlertSeverity
  value: number
  timestamp: number
  deviceId: string
}

const getAlertIcon = (type: AlertType) => {
  switch (type) {
    case "temperature":
      return Thermometer
    case "humidity":
      return Droplets
    case "soilMoisture":
      return Flower
    case "light":
      return Sun
    default:
      return AlertTriangle
  }
}

const getAlertBadgeVariant = (severity: AlertSeverity) => {
  return severity === "high" ? "warning" : "destructive"
}

export function AlertsPanel() {
  const { language } = useLanguage()
  const { selectedGardenId } = useGarden()
  const t = translations[language]
  const locale = language === "vi" ? vi : enUS

  const { data: sensorData, isLoading } = useQuery({
    queryKey: ["sensorData", selectedGardenId],
    queryFn: async () => {
      if (!selectedGardenId) return []
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      return await deviceService.getSensorData(selectedGardenId, yesterday, now)
    },
    enabled: !!selectedGardenId,
  })

  // Tạo cảnh báo từ dữ liệu cảm biến
  const alerts: Alert[] = []
  
  if (sensorData && sensorData.length > 0) {
    sensorData.forEach((data) => {
      const timestamp = new Date(data.recordedAt).getTime()
      
      // Kiểm tra nhiệt độ
      if (data.temperature) {
        if (data.temperature > 35) {
          alerts.push({
            id: `temp-high-${timestamp}`,
            type: "temperature",
            severity: "high",
            value: data.temperature,
            timestamp,
            deviceId: selectedGardenId!,
          })
        } else if (data.temperature < 15) {
          alerts.push({
            id: `temp-low-${timestamp}`,
            type: "temperature",
            severity: "low",
            value: data.temperature,
            timestamp,
            deviceId: selectedGardenId!,
          })
        }
      }
      
      // Kiểm tra độ ẩm
      if (data.humidity) {
        if (data.humidity > 80) {
          alerts.push({
            id: `hum-high-${timestamp}`,
            type: "humidity",
            severity: "high",
            value: data.humidity,
            timestamp,
            deviceId: selectedGardenId!,
          })
        } else if (data.humidity < 30) {
          alerts.push({
            id: `hum-low-${timestamp}`,
            type: "humidity",
            severity: "low",
            value: data.humidity,
            timestamp,
            deviceId: selectedGardenId!,
          })
        }
      }
      
      // Kiểm tra độ ẩm đất
      if (data.soilMoisture) {
        if (data.soilMoisture > 90) {
          alerts.push({
            id: `soil-high-${timestamp}`,
            type: "soilMoisture",
            severity: "high",
            value: data.soilMoisture,
            timestamp,
            deviceId: selectedGardenId!,
          })
        } else if (data.soilMoisture < 20) {
          alerts.push({
            id: `soil-low-${timestamp}`,
            type: "soilMoisture",
            severity: "low",
            value: data.soilMoisture,
            timestamp,
            deviceId: selectedGardenId!,
          })
        }
      }
      
      // Kiểm tra ánh sáng
      if (data.lightLevel) {
        if (data.lightLevel > 90) {
          alerts.push({
            id: `light-high-${timestamp}`,
            type: "light",
            severity: "high",
            value: data.lightLevel,
            timestamp,
            deviceId: selectedGardenId!,
          })
        } else if (data.lightLevel < 10) {
          alerts.push({
            id: `light-low-${timestamp}`,
            type: "light",
            severity: "low",
            value: data.lightLevel,
            timestamp,
            deviceId: selectedGardenId!,
          })
        }
      }
    })
  }
  
  // Sắp xếp cảnh báo theo thời gian, mới nhất lên đầu
  const sortedAlerts = alerts.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5)

  return (
    <Card className="shadow-md animate-in fade-in-50 duration-300">
      <CardHeader className="pb-2">
        <CardTitle>{t.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">{t.loading}</p>
          </div>
        ) : sortedAlerts.length === 0 ? (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-muted-foreground">{t.noAlerts}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedAlerts.map((alert) => {
              const AlertIcon = getAlertIcon(alert.type)
              const badgeVariant = getAlertBadgeVariant(alert.severity)
              const timeAgo = formatDistanceToNow(new Date(alert.timestamp), { 
                addSuffix: true,
                locale 
              })
              
              return (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card text-card-foreground shadow-sm"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${
                      alert.severity === "high" ? "bg-yellow-100" : "bg-red-100"
                    }`}>
                      <AlertIcon className={`h-5 w-5 ${
                        alert.severity === "high" ? "text-yellow-500" : "text-red-500"
                      }`} />
                    </div>
                    <div>
                      <div className="font-medium">
                        {t[alert.type]}
                        <Badge variant={badgeVariant} className="ml-2">
                          {t[alert.severity]}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {alert.value.toFixed(1)} {alert.type === "temperature" ? "°C" : "%"}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {timeAgo}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

