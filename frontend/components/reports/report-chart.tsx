"use client"

import { useState } from "react"
import { useLanguage } from "@/providers/language-provider"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

const translations = {
  en: {
    title: "Sensor Data Analysis",
    temperature: "Temperature",
    humidity: "Humidity",
    soilMoisture: "Soil Moisture",
    light: "Light",
    chartType: "Chart Type",
    timeRanges: {
      "1h": "1 Hour",
      "24h": "24 Hours",
      "7d": "7 Days",
      "1m": "1 Month",
    },
    types: {
      line: "Line Chart",
      bar: "Bar Chart",
    },
  },
  vi: {
    title: "Phân tích Dữ liệu Cảm biến",
    temperature: "Nhiệt độ",
    humidity: "Độ ẩm không khí",
    soilMoisture: "Độ ẩm đất",
    light: "Ánh sáng",
    chartType: "Loại Biểu đồ",
    timeRanges: {
      "1h": "1 Giờ",
      "24h": "24 Giờ",
      "7d": "7 Ngày",
      "1m": "1 Tháng",
    },
    types: {
      line: "Biểu đồ đường",
      bar: "Biểu đồ cột",
    },
  },
}

type ChartData = {
  timestamp: string
  temperature: number
  humidity: number
  soilMoisture: number
  light: number
}

type ReportChartProps = {
  data: ChartData[]
}

export function ReportChart({ data }: ReportChartProps) {
  const { language } = useLanguage()
  const t = translations[language]
  const [chartType, setChartType] = useState<"line" | "bar">("line")
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d" | "1m">("24h")

  const renderChart = () => {
    const ChartComponent = chartType === "line" ? LineChart : BarChart
    const DataComponent = chartType === "line" ? Line : Bar

    return (
      <ResponsiveContainer width="100%" height={400}>
        <ChartComponent data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" />
          <YAxis />
          <Tooltip />
          <Legend />
          <DataComponent type="monotone" dataKey="temperature" stroke="#ef4444" fill="#ef4444" name={t.temperature} />
          <DataComponent type="monotone" dataKey="humidity" stroke="#3b82f6" fill="#3b82f6" name={t.humidity} />
          <DataComponent type="monotone" dataKey="soilMoisture" stroke="#84cc16" fill="#84cc16" name={t.soilMoisture} />
          <DataComponent type="monotone" dataKey="light" stroke="#eab308" fill="#eab308" name={t.light} />
        </ChartComponent>
      </ResponsiveContainer>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t.title}</h2>
        <div className="flex items-center gap-4">
          <Select value={chartType} onValueChange={(value: "line" | "bar") => setChartType(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t.chartType} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line">{t.types.line}</SelectItem>
              <SelectItem value="bar">{t.types.bar}</SelectItem>
            </SelectContent>
          </Select>

          <Tabs value={timeRange} onValueChange={(value: "1h" | "24h" | "7d" | "1m") => setTimeRange(value)}>
            <TabsList>
              {(Object.keys(t.timeRanges) as Array<"1h" | "24h" | "7d" | "1m">).map((range) => (
                <TabsTrigger key={range} value={range}>
                  {t.timeRanges[range]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {renderChart()}
    </div>
  )
}

