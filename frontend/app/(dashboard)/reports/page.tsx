"use client"

import { useState } from "react"
import { ReportFilters } from "@/components/reports/report-filters"
import { AIInsights } from "@/components/reports/ai-insights"
import { ReportChart } from "@/components/reports/report-chart"
import { ReportScheduler } from "@/components/reports/report-scheduler"
import { DetailedReport } from "@/components/reports/detailed-report"
import { useLanguage } from "@/providers/language-provider"
import { useGarden } from "@/contexts/garden-context"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar, Share2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { deviceService } from "@/lib/services/device"
import { reportService } from "@/lib/services/report"

const translations = {
  en: {
    title: "Reports & Analysis",
    schedule: "Schedule Reports",
  },
  vi: {
    title: "Báo cáo & Phân tích",
    schedule: "Lên lịch Báo cáo",
  },
}

type ChartData = {
  timestamp: string
  temperature: number
  humidity: number
  soilMoisture: number
  light: number
}

export default function ReportsPage() {
  const { language } = useLanguage()
  const { selectedGardenId } = useGarden()
  const t = translations[language]
  const [showScheduler, setShowScheduler] = useState(false)
  const [timeRange, setTimeRange] = useState({ from: new Date(), to: new Date() })

  const { data: sensorData = [], isLoading: isDataLoading } = useQuery({
    queryKey: ["sensor-data", selectedGardenId, timeRange],
    queryFn: () => deviceService.getSensorData(selectedGardenId!, timeRange.from, timeRange.to),
    enabled: !!selectedGardenId,
  })

  const { data: aiReport, isLoading: isReportLoading } = useQuery({
    queryKey: ["ai-report", selectedGardenId],
    queryFn: () => reportService.getReports(selectedGardenId!),
    enabled: !!selectedGardenId,
  })

  const handleFilterChange = (filters: any) => {
    setTimeRange(filters.timeRange)
  }

  const latestReport = aiReport?.[0]
  const insights = latestReport ? JSON.parse(latestReport.content).insights : []
  const healthScore = latestReport ? JSON.parse(latestReport.content).healthScore : 0

  const chartData: ChartData[] = sensorData.map(data => ({
    timestamp: new Date(data.recordedAt).toISOString(),
    temperature: data.temperature ?? 0,
    humidity: data.humidity ?? 0,
    soilMoisture: data.soilMoisture ?? 0,
    light: data.lightLevel ?? 0,
  }))

  const isLoading = isDataLoading || isReportLoading

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowScheduler(true)}>
            <Calendar className="mr-2 h-4 w-4" />
            {t.schedule}
          </Button>
        </div>
      </div>

      <ReportFilters onFilterChange={handleFilterChange} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <ReportChart data={chartData} />
        </Card>
        <div className="space-y-6">
          <AIInsights insights={insights} healthScore={healthScore} />
        </div>
      </div>

      <DetailedReport data={chartData} />

      <Dialog open={showScheduler} onOpenChange={setShowScheduler}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t.schedule}</DialogTitle>
          </DialogHeader>
          <ReportScheduler />
        </DialogContent>
      </Dialog>
    </div>
  )
}

