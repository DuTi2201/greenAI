"use client"

import { useState } from "react"
import { ReportFilters } from "@/components/reports/report-filters"
import { AIInsights } from "@/components/reports/ai-insights"
import { ReportChart } from "@/components/reports/report-chart"
import { ReportScheduler } from "@/components/reports/report-scheduler"
import { DetailedReport } from "@/components/reports/detailed-report"
import { AIPredictions } from "@/components/reports/ai-predictions"
import { AIAlerts } from "@/components/reports/ai-alerts"
import { useLanguage } from "@/providers/language-provider"
import { useGarden } from "@/contexts/garden-context"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar, Share2, Download, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useQuery } from "@tanstack/react-query"
import { deviceService } from "@/lib/services/device"
import { reportService } from "@/lib/services/report"
import { aiService } from "@/lib/services/ai"

const translations = {
  en: {
    title: "Reports & Analysis",
    schedule: "Schedule Reports",
    generate: "Generate Report",
    download: "Download PDF",
    tabs: {
      overview: "Overview",
      predictions: "AI Predictions",
      alerts: "Alerts",
      details: "Detailed Data"
    },
    reportTypes: {
      growth: "Growth Analysis",
      efficiency: "Efficiency Analysis",
      issues: "Issues Analysis",
      weekly: "Weekly Summary"
    },
    generating: "Generating...",
    noGarden: "Please select a garden to view reports"
  },
  vi: {
    title: "Báo cáo & Phân tích",
    schedule: "Lên lịch Báo cáo",
    generate: "Tạo Báo cáo",
    download: "Tải PDF",
    tabs: {
      overview: "Tổng quan",
      predictions: "Dự đoán AI",
      alerts: "Cảnh báo",
      details: "Dữ liệu Chi tiết"
    },
    reportTypes: {
      growth: "Phân tích Tăng trưởng",
      efficiency: "Phân tích Hiệu suất",
      issues: "Phân tích Vấn đề",
      weekly: "Tổng kết Hàng tuần"
    },
    generating: "Đang tạo...",
    noGarden: "Vui lòng chọn một vườn để xem báo cáo"
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
  const [timeRange, setTimeRange] = useState({ from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), to: new Date() })
  const [reportType, setReportType] = useState<'growth' | 'efficiency' | 'issues' | 'weekly'>('weekly')
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  const { data: sensorData = [], isLoading: isDataLoading } = useQuery({
    queryKey: ["sensor-data", selectedGardenId, timeRange],
    queryFn: () => deviceService.getSensorData(selectedGardenId!, timeRange.from, timeRange.to),
    enabled: !!selectedGardenId,
  })

  const { data: aiReports = [], isLoading: isReportLoading, refetch: refetchReports } = useQuery({
    queryKey: ["ai-reports", selectedGardenId],
    queryFn: () => aiService.getReports(selectedGardenId!),
    enabled: !!selectedGardenId,
  })

  const handleFilterChange = (filters: { timeRange: { start: Date, end: Date } }) => {
    setTimeRange({
      from: filters.timeRange.start,
      to: filters.timeRange.end
    })
  }

  const handleGenerateReport = async () => {
    if (!selectedGardenId || isGenerating) return
    
    setIsGenerating(true)
    try {
      await aiService.analyzeGarden(selectedGardenId, {
        timeRange: {
          start: timeRange.from,
          end: timeRange.to
        },
        reportType
      })
      
      // Đợi một chút để báo cáo được xử lý
      setTimeout(() => {
        refetchReports()
        setIsGenerating(false)
      }, 2000)
    } catch (error) {
      console.error("Failed to generate report:", error)
      setIsGenerating(false)
    }
  }

  const latestReport = aiReports[0]
  const insights = latestReport?.result?.insights || []
  const healthScore = latestReport?.result?.healthScore || 0

  const chartData: ChartData[] = sensorData.map(data => ({
    timestamp: new Date(data.recordedAt).toISOString(),
    temperature: Number(data.temperature) || 0,
    humidity: Number(data.humidity) || 0,
    soilMoisture: Number(data.soilMoisture) || 0,
    light: Number(data.lightLevel) || 0,
  }))

  const isLoading = isDataLoading || isReportLoading

  if (!selectedGardenId) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center h-[50vh]">
        <p className="text-muted-foreground">{t.noGarden}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowScheduler(true)}>
            <Calendar className="mr-2 h-4 w-4" />
            {t.schedule}
          </Button>
          <Button 
            onClick={handleGenerateReport} 
            disabled={isGenerating || !selectedGardenId}
          >
            {isGenerating ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {t.generating}
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                {t.generate}
              </>
            )}
          </Button>
        </div>
      </div>

      <ReportFilters 
        onFilterChange={handleFilterChange} 
        onReportTypeChange={(type) => setReportType(type)}
        reportType={reportType}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="overview">{t.tabs.overview}</TabsTrigger>
          <TabsTrigger value="predictions">{t.tabs.predictions}</TabsTrigger>
          <TabsTrigger value="alerts">{t.tabs.alerts}</TabsTrigger>
          <TabsTrigger value="details">{t.tabs.details}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-6">
              <ReportChart data={chartData} />
            </Card>
            <div className="space-y-6">
              <AIInsights insights={insights} healthScore={healthScore} />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="predictions">
          <AIPredictions />
        </TabsContent>
        
        <TabsContent value="alerts">
          <AIAlerts />
        </TabsContent>
        
        <TabsContent value="details">
          <DetailedReport data={chartData} />
        </TabsContent>
      </Tabs>

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

