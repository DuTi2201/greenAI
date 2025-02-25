"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Thermometer, Droplets, Sun } from "lucide-react"
import { useLanguage } from "@/providers/language-provider"

type DeviceData = {
  id: string
  name: string
  status: "online" | "offline"
  temperature: number
  humidity: number
  light: number
}

const translations = {
  en: {
    status: "Status",
    temperature: "Temperature",
    humidity: "Humidity",
    light: "Light",
    online: "Online",
    offline: "Offline",
  },
  vi: {
    status: "Trạng thái",
    temperature: "Nhiệt độ",
    humidity: "Độ ẩm",
    light: "Ánh sáng",
    online: "Hoạt động",
    offline: "Ngắt kết nối",
  },
}

type DeviceStatusProps = {
  data: DeviceData
}

export function DeviceStatus({ data }: DeviceStatusProps) {
  const { language } = useLanguage()
  const t = translations[language]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{data.name}</CardTitle>
        <Badge variant={data.status === "online" ? "default" : "secondary"}>
          {data.status === "online" ? t.online : t.offline}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col space-y-2">
            <span className="text-xs text-muted-foreground">{t.temperature}</span>
            <div className="flex items-center space-x-2">
              <Thermometer className="h-4 w-4 text-rose-500" />
              <span className="text-2xl font-bold">{data.temperature}°C</span>
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            <span className="text-xs text-muted-foreground">{t.humidity}</span>
            <div className="flex items-center space-x-2">
              <Droplets className="h-4 w-4 text-blue-500" />
              <span className="text-2xl font-bold">{data.humidity}%</span>
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            <span className="text-xs text-muted-foreground">{t.light}</span>
            <div className="flex items-center space-x-2">
              <Sun className="h-4 w-4 text-yellow-500" />
              <span className="text-2xl font-bold">{data.light}lx</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

