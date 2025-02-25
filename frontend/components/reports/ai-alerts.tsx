"use client"

import { useState } from "react"
import { useLanguage } from "@/providers/language-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CheckCircle, Bell, BellOff } from "lucide-react"
import { aiService, AIAlert } from "@/lib/services/ai"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useGarden } from "@/contexts/garden-context"
import { useToast } from "@/components/ui/use-toast"

const translations = {
  en: {
    title: "AI Alerts",
    noAlerts: "No alerts",
    markAsRead: "Mark as read",
    resolve: "Resolve",
    severity: {
      high: "High",
      medium: "Medium",
      low: "Low"
    },
    toasts: {
      markAsRead: "Alert marked as read",
      resolve: "Alert resolved"
    }
  },
  vi: {
    title: "Cảnh báo AI",
    noAlerts: "Không có cảnh báo",
    markAsRead: "Đánh dấu đã đọc",
    resolve: "Giải quyết",
    severity: {
      high: "Cao",
      medium: "Trung bình",
      low: "Thấp"
    },
    toasts: {
      markAsRead: "Đã đánh dấu cảnh báo là đã đọc",
      resolve: "Đã giải quyết cảnh báo"
    }
  },
}

export function AIAlerts() {
  const { language } = useLanguage()
  const t = translations[language]
  const { selectedGardenId } = useGarden()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [processingAlerts, setProcessingAlerts] = useState<string[]>([])

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["ai-alerts", selectedGardenId],
    queryFn: async () => {
      if (!selectedGardenId) return []
      try {
        return await aiService.getAlerts(selectedGardenId)
      } catch (error) {
        console.error("Failed to fetch alerts:", error)
        return []
      }
    },
    enabled: !!selectedGardenId,
  })

  const handleMarkAsRead = async (alertId: string) => {
    if (processingAlerts.includes(alertId)) return
    
    setProcessingAlerts(prev => [...prev, alertId])
    try {
      await aiService.markAlertAsRead(alertId)
      queryClient.invalidateQueries({ queryKey: ["ai-alerts"] })
      toast({
        title: t.toasts.markAsRead,
        variant: "default",
      })
    } catch (error) {
      console.error("Failed to mark alert as read:", error)
    } finally {
      setProcessingAlerts(prev => prev.filter(id => id !== alertId))
    }
  }

  const handleResolve = async (alertId: string) => {
    if (processingAlerts.includes(alertId)) return
    
    setProcessingAlerts(prev => [...prev, alertId])
    try {
      await aiService.resolveAlert(alertId)
      queryClient.invalidateQueries({ queryKey: ["ai-alerts"] })
      toast({
        title: t.toasts.resolve,
        variant: "default",
      })
    } catch (error) {
      console.error("Failed to resolve alert:", error)
    } finally {
      setProcessingAlerts(prev => prev.filter(id => id !== alertId))
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

  const getUnreadAlerts = () => {
    return alerts.filter(alert => !alert.isRead && !alert.isResolved)
  }

  const getResolvedAlerts = () => {
    return alerts.filter(alert => alert.isResolved)
  }

  const unreadAlerts = getUnreadAlerts()
  const resolvedAlerts = getResolvedAlerts()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          {t.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-pulse h-20 w-full bg-muted rounded-md" />
          </div>
        ) : unreadAlerts.length === 0 && resolvedAlerts.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            {t.noAlerts}
          </div>
        ) : (
          <div className="space-y-4">
            {unreadAlerts.map((alert) => (
              <div 
                key={alert.id} 
                className="flex flex-col gap-2 p-3 rounded-lg border border-muted"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <Badge variant={getSeverityColor(alert.severity)}>
                      {t.severity[alert.severity as keyof typeof t.severity]}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">{alert.type}</p>
                      <p className="text-sm">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(alert.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleMarkAsRead(alert.id)}
                      disabled={processingAlerts.includes(alert.id)}
                    >
                      <BellOff className="h-4 w-4 mr-1" />
                      {t.markAsRead}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleResolve(alert.id)}
                      disabled={processingAlerts.includes(alert.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {t.resolve}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {resolvedAlerts.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                {resolvedAlerts.map((alert) => (
                  <div 
                    key={alert.id} 
                    className="flex items-start gap-2 p-2 rounded-md bg-muted/30 mb-2 opacity-70"
                  >
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(alert.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 