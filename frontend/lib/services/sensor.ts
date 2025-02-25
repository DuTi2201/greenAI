import { API_URL } from "@/lib/constants"

interface SensorDataFilter {
  startDate?: string
  endDate?: string
  limit?: number
}

interface SensorData {
  id: string
  gardenId: string
  temperature: number
  humidity: number
  soilMoisture: number
  lightLevel: number
  recordedAt: string
}

class SensorService {
  async getSensorData(gardenId: string, filter?: SensorDataFilter): Promise<SensorData[]> {
    try {
      let url = `${API_URL}/api/sensors/${gardenId}/data`
      
      // Add query parameters if filters are provided
      if (filter) {
        const params = new URLSearchParams()
        if (filter.startDate) params.append("startDate", filter.startDate)
        if (filter.endDate) params.append("endDate", filter.endDate)
        if (filter.limit) params.append("limit", filter.limit.toString())
        url += `?${params.toString()}`
      }
      
      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch sensor data")
      }

      return await response.json()
    } catch (error) {
      console.error("Error fetching sensor data:", error)
      throw error
    }
  }

  async getLatestSensorData(gardenId: string): Promise<SensorData> {
    try {
      const response = await fetch(`${API_URL}/api/sensors/${gardenId}/latest`, {
        method: "GET",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch latest sensor data")
      }

      return await response.json()
    } catch (error) {
      console.error("Error fetching latest sensor data:", error)
      throw error
    }
  }

  async getSensorStats(gardenId: string, timeRange: string): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/sensors/${gardenId}/stats?timeRange=${timeRange}`, {
        method: "GET",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch sensor statistics")
      }

      return await response.json()
    } catch (error) {
      console.error("Error fetching sensor statistics:", error)
      throw error
    }
  }
}

export const sensorService = new SensorService() 