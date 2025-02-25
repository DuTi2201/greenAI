"use client"

import { useLanguage } from "@/providers/language-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const translations = {
  en: {
    temperature: "Temperature",
    humidity: "Humidity",
    light: "Light",
    time: "Time",
  },
  vi: {
    temperature: "Nhiệt độ",
    humidity: "Độ ẩm",
    light: "Ánh sáng",
    time: "Thời gian",
  },
}

type DataPoint = {
  timestamp: string
  temperature: number
  humidity: number
  light: number
}

type RealTimeChartProps = {
  data: DataPoint[]
}

export function RealTimeChart({ data }: RealTimeChartProps) {
  const { language } = useLanguage()
  const t = translations[language]

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Sensor Data</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" label={{ value: t.time, position: "bottom" }} />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="temperature" stroke="#ef4444" name={t.temperature} />
            <Line type="monotone" dataKey="humidity" stroke="#3b82f6" name={t.humidity} />
            <Line type="monotone" dataKey="light" stroke="#eab308" name={t.light} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

