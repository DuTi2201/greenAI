"use client"

import { GardenProvider } from "@/contexts/garden-context"
import { GardenSelector } from "@/components/dashboard/garden-selector"
import { OverviewCards } from "@/components/dashboard/overview-cards"
import { SensorChart } from "@/components/dashboard/sensor-chart"
import { DeviceStatusPanel } from "@/components/dashboard/device-status-panel"
import { AlertsPanel } from "@/components/dashboard/alerts-panel"
import { useGarden } from "@/contexts/garden-context"
import { useLanguage } from "@/providers/language-provider"
import { Loader2 } from "lucide-react"

const translations = {
  en: {
    title: "Dashboard",
    loading: "Loading garden data...",
    noGarden: "No garden selected. Please select a garden to view data.",
  },
  vi: {
    title: "Bảng điều khiển",
    loading: "Đang tải dữ liệu vườn...",
    noGarden: "Chưa chọn vườn. Vui lòng chọn một vườn để xem dữ liệu.",
  },
}

// Chuyển đổi từ Garden status sang GardenStatus cho OverviewCards
const mapGardenStatus = (status: "healthy" | "warning" | "critical"): "healthy" | "medium" | "critical" => {
  if (status === "warning") return "medium";
  return status;
}

export default function DashboardPage() {
  return (
    <GardenProvider>
      <div className="container mx-auto p-4 space-y-6 min-h-screen">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 z-10 bg-background pt-2 pb-4 border-b">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <GardenSelector />
        </div>

        <DashboardContent />
      </div>
    </GardenProvider>
  )
}

function DashboardContent() {
  const { selectedGardenId, gardens, isLoading } = useGarden()
  const { language } = useLanguage()
  const t = translations[language]
  
  const selectedGarden = gardens.find((g) => g.id === selectedGardenId)

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">{t.loading}</p>
      </div>
    )
  }

  if (!selectedGarden) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">{t.noGarden}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <OverviewCards
        gardenName={selectedGarden.name}
        status={mapGardenStatus(selectedGarden.status)}
        devicesOnline={selectedGarden.devicesOnline}
        totalDevices={selectedGarden.totalDevices}
        alertCount={selectedGarden.alertCount}
        notificationCount={selectedGarden.notificationCount}
      />

      <div className="mt-6">
        <SensorChart />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        <DeviceStatusPanel />
        <AlertsPanel />
      </div>
    </div>
  )
}

