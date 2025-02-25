import { API_URL } from "@/lib/constants"

interface TimeRange {
  start: Date
  end: Date
}

interface ReportRequest {
  timeRange: TimeRange
  reportType: string
}

interface PredictionRequest {
  predictionHorizon: number
}

interface AIAlert {
  id: string
  gardenId: string
  type: string
  severity: string
  message: string
  isRead: boolean
  isResolved: boolean
  createdAt: string
}

class AIService {
  async generateReport(gardenId: string, request: ReportRequest) {
    try {
      const response = await fetch(`${API_URL}/api/ai/analyze/${gardenId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timeRange: {
            start: request.timeRange.start.toISOString(),
            end: request.timeRange.end.toISOString(),
          },
          reportType: request.reportType,
        }),
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to generate report")
      }

      return await response.json()
    } catch (error) {
      console.error("Error generating report:", error)
      throw error
    }
  }

  async downloadReport(gardenId: string, reportType: string) {
    try {
      const response = await fetch(`${API_URL}/api/ai/reports/${gardenId}/download?type=${reportType}`, {
        method: "GET",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to download report")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `garden_report_${reportType}_${new Date().toISOString().split("T")[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error downloading report:", error)
      throw error
    }
  }

  async predictTrends(gardenId: string, request: PredictionRequest) {
    try {
      const response = await fetch(`${API_URL}/api/ai/predict/${gardenId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          predictionHorizon: request.predictionHorizon,
        }),
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to predict trends")
      }

      return await response.json()
    } catch (error) {
      console.error("Error predicting trends:", error)
      throw error
    }
  }

  async getAlerts(gardenId: string) {
    try {
      const response = await fetch(`${API_URL}/api/ai/alerts/${gardenId}`, {
        method: "GET",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to get alerts")
      }

      return await response.json()
    } catch (error) {
      console.error("Error getting alerts:", error)
      throw error
    }
  }

  async markAlertAsRead(alertId: string) {
    try {
      const response = await fetch(`${API_URL}/api/ai/alerts/${alertId}/read`, {
        method: "PUT",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to mark alert as read")
      }

      return await response.json()
    } catch (error) {
      console.error("Error marking alert as read:", error)
      throw error
    }
  }

  async resolveAlert(alertId: string) {
    try {
      const response = await fetch(`${API_URL}/api/ai/alerts/${alertId}/resolve`, {
        method: "PUT",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to resolve alert")
      }

      return await response.json()
    } catch (error) {
      console.error("Error resolving alert:", error)
      throw error
    }
  }
}

export const aiService = new AIService() 