"use client"

import { Suspense, useState } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import WeeklyReport from "@/components/weekly-report"
import AlertHistory from "@/components/alert-history"
import { reportService } from "@/lib/services/report.service"
import { format, startOfWeek, endOfWeek } from "date-fns"
import { toast } from "sonner"

export default function ReportsPage() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      const today = new Date()
      const start = format(startOfWeek(today), 'yyyy-MM-dd')
      const end = format(endOfWeek(today), 'yyyy-MM-dd')
      
      const blob = await reportService.exportPDF(start, end)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bao-cao-${start}-den-${end}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Đã xuất báo cáo PDF thành công')
    } catch (error) {
      console.error('Lỗi khi xuất PDF:', error)
      toast.error('Không thể xuất báo cáo PDF')
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Báo cáo</h1>
        <Button onClick={handleExportPDF} disabled={isExporting}>
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? 'Đang xuất...' : 'Xuất PDF'}
        </Button>
      </div>

      <div className="space-y-8">
        <Suspense fallback={<div>Đang tải báo cáo tuần...</div>}>
          <WeeklyReport />
        </Suspense>

        <Suspense fallback={<div>Đang tải lịch sử cảnh báo...</div>}>
          <AlertHistory />
        </Suspense>
      </div>
    </div>
  )
}

