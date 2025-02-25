"use client"

import { useState } from "react"
import { useLanguage } from "@/providers/language-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useGarden } from "@/contexts/garden-context"
import { useQuery } from "@tanstack/react-query"
import { deviceService } from "@/lib/services/device"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Loader2 } from "lucide-react"

const translations = {
  en: {
    title: "Sensor Data",
    temperature: "Temperature",
    humidity: "Humidity",
    soilMoisture: "Soil Moisture",
    light: "Light",
    timeRange: {
      hour: "Last Hour",
      day: "Last Day",
      week: "Last Week",
      month: "Last Month",
    },
    loading: "Loading sensor data...",
    noData: "No sensor data available",
  },
  vi: {
    title: "Dữ liệu Cảm biến",
    temperature: "Nhiệt độ",
    humidity: "Độ ẩm",
    soilMoisture: "Độ ẩm đất",
    light: "Ánh sáng",
    timeRange: {
      hour: "Giờ qua",
      day: "Ngày qua",
      week: "Tuần qua",
      month: "Tháng qua",
    },
    loading: "Đang tải dữ liệu cảm biến...",
    noData: "Không có dữ liệu cảm biến",
  },
}

type TimeRange = "hour" | "day" | "week" | "month"

const getTimeRangeInMs = (range: TimeRange) => {
  const now = new Date()
  switch (range) {
    case "hour":
      return now.getTime() - 60 * 60 * 1000
    case "day":
      return now.getTime() - 24 * 60 * 60 * 1000
    case "week":
      return now.getTime() - 7 * 24 * 60 * 60 * 1000
    case "month":
      return now.getTime() - 30 * 24 * 60 * 60 * 1000
  }
}

const formatTimestamp = (date: Date) => {
  return `${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")}`
}

export function SensorChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>("hour")
  const { selectedGardenId } = useGarden()
  const { language } = useLanguage()
  const t = translations[language]

  const { data: sensorData, isLoading } = useQuery({
    queryKey: ["sensorData", selectedGardenId, timeRange],
    queryFn: async () => {
      if (!selectedGardenId) return []
      const from = new Date(getTimeRangeInMs(timeRange))
      const to = new Date()
      return await deviceService.getSensorData(selectedGardenId, from, to)
    },
    refetchInterval: timeRange === "hour" ? 30000 : false,
    enabled: !!selectedGardenId,
  })

  const chartData = sensorData?.map((data) => ({
    time: formatTimestamp(new Date(data.recordedAt)),
    temperature: data.temperature,
    humidity: data.humidity,
    soilMoisture: data.soilMoisture,
    light: data.lightLevel,
  })) || []

  return (
    <Card className="shadow-md animate-in fade-in-50 duration-300">
      <CardHeader className="pb-2">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <CardTitle>{t.title}</CardTitle>
          <Tabs
            defaultValue="hour"
            value={timeRange}
            onValueChange={(value) => setTimeRange(value as TimeRange)}
            className="w-full md:w-auto"
          >
            <TabsList className="grid grid-cols-4 w-full md:w-auto">
              <TabsTrigger value="hour">{t.timeRange.hour}</TabsTrigger>
              <TabsTrigger value="day">{t.timeRange.day}</TabsTrigger>
              <TabsTrigger value="week">{t.timeRange.week}</TabsTrigger>
              <TabsTrigger value="month">{t.timeRange.month}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">{t.loading}</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-muted-foreground">{t.noData}</p>
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12 }}
                  tickMargin={10}
                />
                <YAxis tick={{ fontSize: 12 }} tickMargin={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.8)",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="#ef4444"
                  name={t.temperature}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="humidity"
                  stroke="#3b82f6"
                  name={t.humidity}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="soilMoisture"
                  stroke="#10b981"
                  name={t.soilMoisture}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="light"
                  stroke="#f59e0b"
                  name={t.light}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

