"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Leaf } from "lucide-react"
import { sensorService } from "@/lib/services/sensor.service"
import { Skeleton } from "@/components/ui/skeleton"

function getHealthStatus(data: any) {
  if (!data) return { status: 'Unknown', color: 'text-gray-500' }

  const { temperature, humidity, soilMoisture, light } = data
  
  // Kiểm tra các điều kiện lý tưởng
  const isTemperatureOk = temperature >= 20 && temperature <= 30
  const isHumidityOk = humidity >= 60 && humidity <= 80
  const isSoilMoistureOk = soilMoisture >= 50 && soilMoisture <= 70
  const isLightOk = light >= 400 && light <= 600

  // Tính số điều kiện thỏa mãn
  const healthyConditions = [isTemperatureOk, isHumidityOk, isSoilMoistureOk, isLightOk].filter(Boolean).length

  if (healthyConditions === 4) return { status: 'Excellent', color: 'text-green-500' }
  if (healthyConditions === 3) return { status: 'Good', color: 'text-blue-500' }
  if (healthyConditions === 2) return { status: 'Fair', color: 'text-yellow-500' }
  return { status: 'Poor', color: 'text-red-500' }
}

export default function PlantHealth() {
  const { data: sensorData, isLoading, error } = useQuery({
    queryKey: ['sensorData'],
    queryFn: () => sensorService.getLatest(),
    refetchInterval: 5000,
  })

  const health = getHealthStatus(sensorData)

  if (error) {
    return <div className="text-red-500">Error loading plant health data</div>
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">Plant Health</CardTitle>
        <Leaf className={`h-5 w-5 ${health.color}`} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <div className="space-y-4">
            <div className={`text-2xl font-bold ${health.color}`}>
              {health.status}
            </div>
            <div className="text-sm text-muted-foreground">
              Based on temperature, humidity, soil moisture, and light conditions
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

