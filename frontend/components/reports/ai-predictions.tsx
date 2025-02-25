"use client"

import { useState } from "react"
import { useLanguage } from "@/providers/language-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2, TrendingUp, AlertTriangle, Calendar } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { aiService } from "@/lib/services/ai"
import { useQuery } from "@tanstack/react-query"
import { useGarden } from "@/contexts/garden-context"

const translations = {
  en: {
    title: "AI Predictions",
    generate: "Generate Predictions",
    generating: "Generating...",
    temperature: "Temperature",
    humidity: "Humidity",
    soilMoisture: "Soil Moisture",
    lightLevel: "Light Level",
    alerts: "Predicted Alerts",
    recommendations: "Recommendations",
    days: "days",
    confidence: "Confidence",
    noData: "No prediction data available",
    alertSeverity: {
      high: "High",
      medium: "Medium",
      low: "Low"
    }
  },
  vi: {
    title: "Dự đoán AI",
    generate: "Tạo Dự đoán",
    generating: "Đang tạo...",
    temperature: "Nhiệt độ",
    humidity: "Độ ẩm",
    soilMoisture: "Độ ẩm đất",
    lightLevel: "Độ sáng",
    alerts: "Cảnh báo Dự đoán",
    recommendations: "Khuyến nghị",
    days: "ngày",
    confidence: "Độ tin cậy",
    noData: "Không có dữ liệu dự đoán",
    alertSeverity: {
      high: "Cao",
      medium: "Trung bình",
      low: "Thấp"
    }
  },
}

export function AIPredictions() {
  const { language } = useLanguage()
  const t = translations[language]
  const { selectedGardenId } = useGarden()
  const [predictionHorizon, setPredictionHorizon] = useState(7)
  const [isGenerating, setIsGenerating] = useState(false)

  const { data: predictions, isLoading, refetch } = useQuery({
    queryKey: ["ai-predictions", selectedGardenId],
    queryFn: async () => {
      if (!selectedGardenId) return null
      try {
        return await aiService.predictTrends(selectedGardenId, { predictionHorizon })
      } catch (error) {
        console.error("Failed to fetch predictions:", error)
        return null
      }
    },
    enabled: !!selectedGardenId,
  })

  const handleGeneratePredictions = async () => {
    if (!selectedGardenId || isGenerating) return
    
    setIsGenerating(true)
    try {
      await refetch()
    } finally {
      setIsGenerating(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "destructive"
      case "medium":
        return "warning"
      case "low":
        return "secondary"
      default:
        return "secondary"
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {t.title}
        </CardTitle>
        <Button 
          onClick={handleGeneratePredictions} 
          disabled={isLoading || isGenerating || !selectedGardenId}
          size="sm"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t.generating}
            </>
          ) : (
            <>
              <Calendar className="mr-2 h-4 w-4" />
              {t.generate} ({predictionHorizon} {t.days})
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading || isGenerating ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !predictions ? (
          <div className="text-center py-8 text-muted-foreground">
            {t.noData}
          </div>
        ) : (
          <>
            <Tabs defaultValue="temperature">
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="temperature">{t.temperature}</TabsTrigger>
                <TabsTrigger value="humidity">{t.humidity}</TabsTrigger>
                <TabsTrigger value="soilMoisture">{t.soilMoisture}</TabsTrigger>
                <TabsTrigger value="lightLevel">{t.lightLevel}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="temperature" className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={predictions.predictions.temperature}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any, name: any) => [
                        `${value}°C`, 
                        name === "value" ? t.temperature : t.confidence
                      ]}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#ff4d4f" name={t.temperature} />
                    <Line type="monotone" dataKey="confidence" stroke="#1890ff" name={t.confidence} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
              
              <TabsContent value="humidity" className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={predictions.predictions.humidity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any, name: any) => [
                        `${value}%`, 
                        name === "value" ? t.humidity : t.confidence
                      ]}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#1890ff" name={t.humidity} />
                    <Line type="monotone" dataKey="confidence" stroke="#1890ff" name={t.confidence} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
              
              <TabsContent value="soilMoisture" className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={predictions.predictions.soilMoisture}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any, name: any) => [
                        `${value}%`, 
                        name === "value" ? t.soilMoisture : t.confidence
                      ]}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#52c41a" name={t.soilMoisture} />
                    <Line type="monotone" dataKey="confidence" stroke="#1890ff" name={t.confidence} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
              
              <TabsContent value="lightLevel" className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={predictions.predictions.lightLevel}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any, name: any) => [
                        `${value} lux`, 
                        name === "value" ? t.lightLevel : t.confidence
                      ]}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#faad14" name={t.lightLevel} />
                    <Line type="monotone" dataKey="confidence" stroke="#1890ff" name={t.confidence} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>
            
            {predictions.alerts && predictions.alerts.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  {t.alerts}
                </h4>
                <div className="space-y-2">
                  {predictions.alerts.map((alert: any, index: number) => (
                    <div key={index} className="flex items-start gap-2 p-2 rounded-md bg-muted/50">
                      <Badge variant={getSeverityColor(alert.severity)}>
                        {t.alertSeverity[alert.severity as keyof typeof t.alertSeverity]}
                      </Badge>
                      <div className="text-sm">
                        <p>{alert.message}</p>
                        <p className="text-xs text-muted-foreground">{alert.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {predictions.recommendations && predictions.recommendations.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">{t.recommendations}</h4>
                <ul className="space-y-1 text-sm">
                  {predictions.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="list-disc list-inside">{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
} 