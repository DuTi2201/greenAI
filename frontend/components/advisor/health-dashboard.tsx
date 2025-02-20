"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts"
import type { SensorData } from "./advisor-content"

interface HealthDashboardProps {
  healthScore: number
  sensorData: SensorData
}

export default function HealthDashboard({ healthScore, sensorData }: HealthDashboardProps) {
  const getHealthColor = (score: number) => {
    if (score >= 80) return "bg-green-500"
    if (score >= 50) return "bg-yellow-500"
    return "bg-red-500"
  }

  const radarData = [
    {
      subject: "Nhiệt độ",
      current: sensorData.temperature,
      ideal: 25,
      fullMark: 40,
    },
    {
      subject: "Độ ẩm đất",
      current: sensorData.soilMoisture,
      ideal: 60,
      fullMark: 100,
    },
    {
      subject: "Ánh sáng",
      current: sensorData.lightIntensity,
      ideal: 500,
      fullMark: 1000,
    },
    {
      subject: "Độ ẩm KK",
      current: sensorData.airHumidity,
      ideal: 70,
      fullMark: 100,
    },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sức khỏe cây trồng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center">
            <div className="relative w-40 h-40">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-bold">{healthScore}%</span>
              </div>
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  className="text-muted stroke-current"
                  strokeWidth="10"
                  fill="transparent"
                  r="40"
                  cx="50"
                  cy="50"
                />
                <circle
                  className={`${getHealthColor(healthScore)} stroke-current`}
                  strokeWidth="10"
                  strokeLinecap="round"
                  fill="transparent"
                  r="40"
                  cx="50"
                  cy="50"
                  style={{
                    strokeDasharray: `${healthScore * 2.51}, 251.2`,
                    transform: "rotate(-90deg)",
                    transformOrigin: "50% 50%",
                  }}
                />
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hidden lg:block">
        <CardHeader>
          <CardTitle>So sánh chỉ số</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[300px]">
            <ResponsiveContainer>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <Radar name="Hiện tại" dataKey="current" stroke="#22c55e" fill="#22c55e" fillOpacity={0.5} />
                <Radar name="Lý tưởng" dataKey="ideal" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="lg:hidden space-y-4">
        {radarData.map((item) => (
          <div key={item.subject} className="space-y-2">
            <div className="flex justify-between">
              <span>{item.subject}</span>
              <span>
                {item.current}/{item.ideal}
              </span>
            </div>
            <Progress value={(item.current / item.ideal) * 100} />
          </div>
        ))}
      </div>
    </div>
  )
}

