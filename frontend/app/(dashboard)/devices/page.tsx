"use client"

import { useState } from "react"
import { DeviceControl } from "@/components/devices/device-control"
import { useLanguage } from "@/providers/language-provider"
import { useQuery } from "@tanstack/react-query"
import { deviceService } from "@/lib/services/device"

const translations = {
  en: {
    title: "Device Management",
    noGardens: "No gardens found. Add a garden in Settings to manage devices.",
  },
  vi: {
    title: "Quản lý Thiết bị",
    noGardens: "Không tìm thấy vườn nào. Thêm vườn trong phần Cài đặt để quản lý thiết bị.",
  },
}

export default function DevicesPage() {
  const { language } = useLanguage()
  const t = translations[language]
  
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

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t.title}</h1>
      </div>

      {devices.length > 0 ? (
        <div className={`grid grid-cols-1 gap-6 transition-opacity duration-300 ${isLoading ? "opacity-50" : "opacity-100"}`}>
          {devices.map((device) => (
            <DeviceControl
              key={device.id}
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
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-8">{t.noGardens}</div>
      )}
    </div>
  )
}

