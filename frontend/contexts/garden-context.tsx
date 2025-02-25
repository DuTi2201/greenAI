"use client"

import { createContext, useContext, useState, useCallback, useEffect } from "react"
import type { ReactNode } from "react"
import { deviceService, Device, DeviceStatus, SensorData } from "@/lib/services/device"
import { useQuery } from "@tanstack/react-query"

export type Garden = {
  id: string
  name: string
  status: "healthy" | "warning" | "critical"
  devicesOnline: number
  totalDevices: number
  alertCount: number
  notificationCount: number
  devices: {
    fan: boolean
    pump: boolean
    led: boolean
  }
  sensors: {
    temperature: number
    humidity: number
    soilMoisture: number
    light: number
  }
}

type GardenContextType = {
  gardens: Garden[]
  selectedGardenId: string | null
  selectGarden: (id: string) => void
  isLoading: boolean
  error: string | null
}

const GardenContext = createContext<GardenContextType | undefined>(undefined)

function transformDeviceToGarden(device: Device): Garden {
  const latestStatus = device.deviceStatus?.[0]
  const latestSensor = device.sensorData?.[0]

  return {
    id: device.id,
    name: device.name,
    status: getDeviceStatus(latestStatus, latestSensor),
    devicesOnline: device.status === 'active' ? 1 : 0,
    totalDevices: 1,
    alertCount: getAlertCount(latestStatus, latestSensor),
    notificationCount: 0,
    devices: {
      fan: latestStatus?.fanStatus || false,
      pump: latestStatus?.waterPumpStatus || false,
      led: latestStatus?.ledStatus || false,
    },
    sensors: {
      temperature: latestSensor?.temperature || 0,
      humidity: latestSensor?.humidity || 0,
      soilMoisture: latestSensor?.soilMoisture || 0,
      light: latestSensor?.lightLevel || 0,
    },
  }
}

function getDeviceStatus(
  status?: DeviceStatus,
  sensor?: SensorData
): "healthy" | "warning" | "critical" {
  if (!status || !sensor) return "warning"
  
  // Kiểm tra các điều kiện cảnh báo
  const isTemperatureWarning = sensor.temperature && (sensor.temperature < 15 || sensor.temperature > 35)
  const isHumidityWarning = sensor.humidity && (sensor.humidity < 40 || sensor.humidity > 80)
  const isSoilMoistureWarning = sensor.soilMoisture && (sensor.soilMoisture < 30 || sensor.soilMoisture > 90)
  
  if (isTemperatureWarning || isHumidityWarning || isSoilMoistureWarning) {
    return "warning"
  }
  
  return "healthy"
}

function getAlertCount(status?: DeviceStatus, sensor?: SensorData): number {
  let count = 0
  
  if (!status || !sensor) return count
  
  // Đếm số cảnh báo
  if (sensor.temperature && (sensor.temperature < 15 || sensor.temperature > 35)) count++
  if (sensor.humidity && (sensor.humidity < 40 || sensor.humidity > 80)) count++
  if (sensor.soilMoisture && (sensor.soilMoisture < 30 || sensor.soilMoisture > 90)) count++
  
  return count
}

export function GardenProvider({ children }: { children: ReactNode }) {
  const [selectedGardenId, setSelectedGardenId] = useState<string | null>(null)

  // Fetch devices using React Query
  const { data: devices = [], isLoading, error } = useQuery<Device[], Error>({
    queryKey: ['devices'],
    queryFn: () => deviceService.getAllDevices(),
    refetchInterval: 30000, // Refetch every 30 seconds
    // Cấu hình để không hiển thị lỗi trong console
    retry: false,
    refetchOnWindowFocus: false
  })

  // Xử lý lỗi một cách yên lặng
  useEffect(() => {
    if (error && error.message) {
      // Không hiển thị lỗi trong console
    }
  }, [error]);

  // Transform devices to gardens
  const gardens = devices.map(transformDeviceToGarden)

  // Set initial selected garden
  useEffect(() => {
    if (gardens.length > 0 && !selectedGardenId) {
      setSelectedGardenId(gardens[0].id)
    }
  }, [gardens, selectedGardenId])

  const selectGarden = useCallback((id: string) => {
    setSelectedGardenId(id)
  }, [])

  return (
    <GardenContext.Provider
      value={{
        gardens,
        selectedGardenId,
        selectGarden,
        isLoading,
        error: error ? 'Failed to load garden data' : null,
      }}
    >
      {children}
    </GardenContext.Provider>
  )
}

export function useGarden() {
  const context = useContext(GardenContext)
  if (context === undefined) {
    throw new Error("useGarden must be used within a GardenProvider")
  }
  return context
}

