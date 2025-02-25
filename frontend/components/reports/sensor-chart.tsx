"use client"

import { useLanguage } from "@/providers/language-provider"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

const translations = {
  en: {
    temperature: "Temperature (°C)",
    humidity: "Humidity (%)",
    soilMoisture: "Soil Moisture (%)",
    lightLevel: "Light Level (lux)",
    time: "Time",
    date: "Date",
  },
  vi: {
    temperature: "Nhiệt độ (°C)",
    humidity: "Độ ẩm (%)",
    soilMoisture: "Độ ẩm đất (%)",
    lightLevel: "Ánh sáng (lux)",
    time: "Thời gian",
    date: "Ngày",
  },
}

const colors = {
  temperature: "#FF6B6B",
  humidity: "#4ECDC4",
  soilMoisture: "#8675A9",
  lightLevel: "#FFD166",
}

interface SensorChartProps {
  data: any[]
  dataKey: "temperature" | "humidity" | "soilMoisture" | "lightLevel"
  chartType: "line" | "bar"
}

export function SensorChart({ data, dataKey, chartType = "line" }: SensorChartProps) {
  const { language } = useLanguage()
  const t = translations[language]

  // Format data for chart
  const formattedData = data.map((item) => {
    const date = new Date(item.recordedAt)
    return {
      ...item,
      formattedTime: `${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")}`,
      formattedDate: `${date.getDate()}/${date.getMonth() + 1}`,
    }
  })

  // Get min and max values for Y axis domain
  const values = data.map((item) => item[dataKey])
  const min = Math.min(...values)
  const max = Math.max(...values)
  const padding = (max - min) * 0.1
  const yDomain = [Math.max(0, min - padding), max + padding]

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        {chartType === "line" ? (
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="formattedDate"
              stroke="var(--muted-foreground)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="var(--muted-foreground)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              domain={yDomain}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--background)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
              }}
              labelStyle={{ color: "var(--foreground)" }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey={dataKey}
              name={t[dataKey]}
              stroke={colors[dataKey]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        ) : (
          <BarChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="formattedDate"
              stroke="var(--muted-foreground)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="var(--muted-foreground)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              domain={yDomain}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--background)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
              }}
              labelStyle={{ color: "var(--foreground)" }}
            />
            <Legend />
            <Bar
              dataKey={dataKey}
              name={t[dataKey]}
              fill={colors[dataKey]}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  )
} 