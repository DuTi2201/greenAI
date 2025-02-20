"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Thermometer, Droplet, Sun, Cloud } from "lucide-react"
import { sensorService } from "@/lib/services/sensor.service"
import { Skeleton } from "@/components/ui/skeleton"

export default function SensorCards() {
  const { data: sensorData, isLoading, error } = useQuery({
    queryKey: ['sensorData'],
    queryFn: () => sensorService.getLatest(),
    refetchInterval: 5000, // Tự động cập nhật mỗi 5 giây
  })

  if (error) {
    return <div className="text-red-500">Error loading sensor data</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <SensorCard
        title="Temperature"
        value={sensorData?.temperature}
        unit="°C"
        icon={<Thermometer className="h-4 w-4" />}
        isLoading={isLoading}
      />
      <SensorCard
        title="Soil Moisture"
        value={sensorData?.soilMoisture}
        unit="%"
        icon={<Droplet className="h-4 w-4" />}
        isLoading={isLoading}
      />
      <SensorCard
        title="Light Intensity"
        value={sensorData?.light}
        unit="Lux"
        icon={<Sun className="h-4 w-4" />}
        isLoading={isLoading}
      />
      <SensorCard
        title="Air Humidity"
        value={sensorData?.humidity}
        unit="%"
        icon={<Cloud className="h-4 w-4" />}
        isLoading={isLoading}
      />
    </div>
  )
}

interface SensorCardProps {
  title: string
  value?: number
  unit: string
  icon: React.ReactNode
  isLoading: boolean
}

function SensorCard({ title, value, unit, icon, isLoading }: SensorCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-2xl font-bold">
            {value?.toFixed(1)}
            {unit}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

