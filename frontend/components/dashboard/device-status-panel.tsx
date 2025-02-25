"use client"

import { useState } from "react"
import { useLanguage } from "@/providers/language-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useGarden } from "@/contexts/garden-context"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { deviceService, Device } from "@/lib/services/device"
import { Settings, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

const translations = {
  en: {
    title: "Device Status",
    settings: "Settings",
    status: {
      online: "Online",
      offline: "Offline",
      healthy: "Healthy",
      warning: "Warning",
      critical: "Critical",
    },
    fan: "Fan",
    noDevices: "No devices found for this garden",
    loading: "Loading devices...",
    toasts: {
      success: "Device updated successfully",
      error: "Failed to update device",
    },
  },
  vi: {
    title: "Trạng thái Thiết bị",
    settings: "Cài đặt",
    status: {
      online: "Hoạt động",
      offline: "Ngoại tuyến",
      healthy: "Tốt",
      warning: "Cảnh báo",
      critical: "Nguy hiểm",
    },
    fan: "Quạt",
    noDevices: "Không tìm thấy thiết bị cho vườn này",
    loading: "Đang tải thiết bị...",
    toasts: {
      success: "Cập nhật thiết bị thành công",
      error: "Không thể cập nhật thiết bị",
    },
  },
}

export function DeviceStatusPanel() {
  const { language } = useLanguage()
  const { selectedGardenId } = useGarden()
  const { toast } = useToast()
  const router = useRouter()
  const queryClient = useQueryClient()
  const t = translations[language]

  const { data: devices, isLoading } = useQuery({
    queryKey: ["devices", selectedGardenId],
    queryFn: async () => {
      if (!selectedGardenId) return []
      const allDevices = await deviceService.getAllDevices()
      return allDevices.filter(device => device.id === selectedGardenId)
    },
    refetchInterval: 5000, // Refresh every 5 seconds
    enabled: !!selectedGardenId,
  })

  const controlMutation = useMutation({
    mutationFn: ({ deviceId, control }: { deviceId: string; control: { fanStatus?: boolean } }) => 
      deviceService.controlDevice(deviceId, control),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] })
      toast({
        title: t.toasts.success,
      })
    },
    onError: () => {
      toast({
        title: t.toasts.error,
        variant: "destructive",
      })
    },
  })

  const handleFanToggle = (deviceId: string, currentStatus: boolean) => {
    controlMutation.mutate({
      deviceId,
      control: { fanStatus: !currentStatus },
    })
  }

  const navigateToDeviceSettings = (deviceId: string) => {
    router.push(`/devices`)
  }

  const getStatusBadgeVariant = (status: string) => {
    if (status === "active") return "success"
    return "destructive"
  }

  const getHealthBadgeVariant = (device: Device) => {
    // Determine health based on sensor data and device status
    const latestSensor = device.sensorData?.[0]
    
    if (!latestSensor) return "secondary"
    
    const temp = latestSensor.temperature || 0
    const humidity = latestSensor.humidity || 0
    
    if (temp > 35 || temp < 15 || humidity > 90 || humidity < 20) {
      return "destructive"
    } else if (temp > 30 || temp < 18 || humidity > 80 || humidity < 30) {
      return "warning"
    }
    
    return "success"
  }

  const getHealthStatus = (device: Device) => {
    const variant = getHealthBadgeVariant(device)
    
    if (variant === "destructive") return "critical"
    if (variant === "warning") return "warning"
    return "healthy"
  }

  return (
    <Card className="shadow-md animate-in fade-in-50 duration-300">
      <CardHeader className="pb-2">
        <CardTitle>{t.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">{t.loading}</p>
          </div>
        ) : !devices || devices.length === 0 ? (
          <div className="flex items-center justify-center h-[200px]">
            <p className="text-muted-foreground">{t.noDevices}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {devices.map((device) => {
              const latestStatus = device.deviceStatus?.[0]
              const fanStatus = latestStatus?.fanStatus || false
              const isOnline = device.status === "active"
              const healthStatus = getHealthStatus(device)

              return (
                <div
                  key={device.id}
                  className="flex flex-col space-y-4 p-4 rounded-lg border bg-card text-card-foreground shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <h3 className="font-medium">{device.name}</h3>
                      <p className="text-sm text-muted-foreground">{device.location || "No location"}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getStatusBadgeVariant(device.status)}>
                        {isOnline ? t.status.online : t.status.offline}
                      </Badge>
                      <Badge variant={getHealthBadgeVariant(device)}>
                        {t.status[healthStatus]}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{t.fan}</span>
                      <Switch
                        checked={fanStatus}
                        onCheckedChange={() => handleFanToggle(device.id, fanStatus)}
                        disabled={!isOnline || controlMutation.isPending}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateToDeviceSettings(device.id)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      {t.settings}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

