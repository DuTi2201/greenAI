"use client"

import { useLanguage } from "@/providers/language-provider"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Flower2, Wifi, Bell, AlertTriangle } from "lucide-react"
import { useGarden } from "@/contexts/garden-context"

const translations = {
  en: {
    status: {
      healthy: "Healthy",
      medium: "Medium",
      critical: "Critical",
    },
    devices: "Devices Online",
    alerts: "Active Alerts",
    notifications: "New Notifications",
    garden: "Garden",
  },
  vi: {
    status: {
      healthy: "Tốt",
      medium: "Trung bình",
      critical: "Nguy hiểm",
    },
    devices: "Thiết bị Hoạt động",
    alerts: "Cảnh báo",
    notifications: "Thông báo Mới",
    garden: "Vườn",
  },
}

type GardenStatus = "healthy" | "medium" | "critical"

const getStatusColor = (status: GardenStatus) => {
  switch (status) {
    case "healthy":
      return "bg-green-500 hover:bg-green-600"
    case "medium":
      return "bg-yellow-500 hover:bg-yellow-600"
    case "critical":
      return "bg-red-500 hover:bg-red-600"
    default:
      return "bg-gray-500 hover:bg-gray-600"
  }
}

const getStatusBadgeVariant = (status: GardenStatus) => {
  switch (status) {
    case "healthy":
      return "success"
    case "medium":
      return "warning"
    case "critical":
      return "destructive"
    default:
      return "secondary"
  }
}

type OverviewCardsProps = {
  gardenName: string
  status: GardenStatus
  devicesOnline: number
  totalDevices: number
  alertCount: number
  notificationCount: number
}

export function OverviewCards({
  gardenName,
  status,
  devicesOnline,
  totalDevices,
  alertCount,
  notificationCount,
}: OverviewCardsProps) {
  const { language } = useLanguage()
  const { isLoading } = useGarden() // Add this line
  const t = translations[language]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in-50 duration-300">
      <Card className="overflow-hidden border-l-4" style={{ borderLeftColor: status === "healthy" ? "#10b981" : status === "medium" ? "#f59e0b" : "#ef4444" }}>
        <CardContent className="p-6">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t.garden}</span>
              <Badge variant={getStatusBadgeVariant(status)}>
                {t.status[status]}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Flower2 className="h-5 w-5 text-primary" />
              <h3 className="text-2xl font-bold">{gardenName}</h3>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-l-4 border-l-blue-500">
        <CardContent className="p-6">
          <div className="flex flex-col space-y-2">
            <span className="text-sm text-muted-foreground">{t.devices}</span>
            <div className="flex items-center space-x-2">
              <Wifi className="h-5 w-5 text-blue-500" />
              <h3 className="text-2xl font-bold">
                {devicesOnline} <span className="text-sm text-muted-foreground">/ {totalDevices}</span>
              </h3>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-l-4 border-l-amber-500">
        <CardContent className="p-6">
          <div className="flex flex-col space-y-2">
            <span className="text-sm text-muted-foreground">{t.alerts}</span>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h3 className="text-2xl font-bold">{alertCount}</h3>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-l-4 border-l-purple-500">
        <CardContent className="p-6">
          <div className="flex flex-col space-y-2">
            <span className="text-sm text-muted-foreground">{t.notifications}</span>
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-purple-500" />
              <h3 className="text-2xl font-bold">{notificationCount}</h3>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

