"use client"

import { useState } from "react"
import HealthDashboard from "@/components/advisor/health-dashboard"
import AIRecommendations from "@/components/advisor/ai-recommendations"

export type SensorData = {
  temperature: number
  soilMoisture: number
  lightIntensity: number
  airHumidity: number
}

export type Recommendation = {
  title: string
  description: string
  action: string
  device: string
  duration: number
}

// Mock data - replace with actual API calls
const mockSensorData: SensorData = {
  temperature: 28,
  soilMoisture: 15,
  lightIntensity: 200,
  airHumidity: 65,
}

const mockRecommendations: Recommendation[] = [
  {
    title: "Tăng thời gian chiếu sáng",
    description: "Ánh sáng hiện tại 200 Lux (ngưỡng tối ưu: 500 Lux)",
    action: "on",
    device: "led",
    duration: 7200,
  },
  {
    title: "Bật máy bơm",
    description: "Độ ẩm đất 15% (ngưỡng tối thiểu: 20%)",
    action: "on",
    device: "pump",
    duration: 300,
  },
]

export default function AdvisorContent() {
  const [healthScore, setHealthScore] = useState(75)
  const [sensorData, setSensorData] = useState<SensorData>(mockSensorData)
  const [recommendations, setRecommendations] = useState<Recommendation[]>(mockRecommendations)
  const [loading, setLoading] = useState(false)

  const handleApplyAll = async () => {
    setLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setLoading(false)
    // Show success message
    alert("Đã kích hoạt các thiết bị thành công!")
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-grow">
      <HealthDashboard healthScore={healthScore} sensorData={sensorData} />
      <AIRecommendations recommendations={recommendations} onApplyAll={handleApplyAll} loading={loading} />
    </div>
  )
}

