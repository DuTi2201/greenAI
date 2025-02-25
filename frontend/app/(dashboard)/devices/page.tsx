"use client"

import { useState } from "react"
import { DeviceControl } from "@/components/devices/device-control"
import { useLanguage } from "@/providers/language-provider"
import { useQuery } from "@tanstack/react-query"
import { deviceService } from "@/lib/services/device"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2, Settings, Info } from "lucide-react"

const translations = {
  en: {
    title: "Device Management",
    noGardens: "No gardens found. Add a garden in Settings to manage devices.",
    control: "Control",
    settings: "Settings",
    info: "Information",
    lastConnected: "Last Connected",
    status: "Status",
    location: "Location",
    firmware: "Firmware",
    active: "Active",
    inactive: "Inactive",
    loading: "Loading devices...",
  },
  vi: {
    title: "Quản lý Thiết bị",
    noGardens: "Không tìm thấy vườn nào. Thêm vườn trong phần Cài đặt để quản lý thiết bị.",
    control: "Điều khiển",
    settings: "Cài đặt",
    info: "Thông tin",
    lastConnected: "Kết nối cuối",
    status: "Trạng thái",
    location: "Vị trí",
    firmware: "Phiên bản",
    active: "Hoạt động",
    inactive: "Không hoạt động",
    loading: "Đang tải thiết bị...",
  },
}

export default function DevicesPage() {
  const { language } = useLanguage()
  const t = translations[language]
  const [activeTab, setActiveTab] = useState("control")
  
  const { data: devices = [], isLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: () => deviceService.getAllDevices(),
    refetchInterval: 5000, // Tự động cập nhật mỗi 5 giây
  })

  const handleControl = async (deviceId: string, type: string, state: boolean) => {
    try {
      await deviceService.controlDevice(deviceId, {
        [type]: state
      })
    } catch (error) {
      console.warn('Không thể điều khiển thiết bị');
    }
  }

  const formatDate = (date: Date | undefined | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US');
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t.title}</h1>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-sm text-muted-foreground">{t.loading}</p>
        </div>
      ) : devices.length > 0 ? (
        <div className="space-y-8">
          {devices.map((device) => (
            <Card key={device.id} className="shadow-md">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{device.name}</CardTitle>
                    <CardDescription>{device.location || "N/A"}</CardDescription>
                  </div>
                  <Badge variant={device.status === "active" ? "success" : "destructive"}>
                    {device.status === "active" ? t.active : t.inactive}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="control" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-2 mb-4">
                    <TabsTrigger value="control">
                      <Settings className="h-4 w-4 mr-2" />
                      {t.control}
                    </TabsTrigger>
                    <TabsTrigger value="info">
                      <Info className="h-4 w-4 mr-2" />
                      {t.info}
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="control" className="space-y-4">
                    <DeviceControl
                      deviceId={device.id}
                      gardenName={device.name}
                      status={{
                        fan: device.deviceStatus?.[0]?.fanStatus || false,
                        pump: device.deviceStatus?.[0]?.waterPumpStatus || false,
                        led: device.deviceStatus?.[0]?.ledStatus || false,
                        nutrientPump: device.deviceStatus?.[0]?.nutrientPumpStatus || false,
                      }}
                      onControl={handleControl}
                    />
                  </TabsContent>
                  
                  <TabsContent value="info" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">{t.status}</p>
                        <p>{device.status === "active" ? t.active : t.inactive}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">{t.lastConnected}</p>
                        <p>{formatDate(device.lastConnected)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">{t.location}</p>
                        <p>{device.location || "N/A"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">{t.firmware}</p>
                        <p>{device.firmwareVersion || "N/A"}</p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-8">{t.noGardens}</div>
      )}
    </div>
  )
}

