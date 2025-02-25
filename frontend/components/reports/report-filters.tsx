"use client"

import { useState } from "react"
import { useLanguage } from "@/providers/language-provider"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { REPORT_TYPES } from "@/lib/constants"

const translations = {
  en: {
    reportType: "Report Type",
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    custom: "Custom",
    startDate: "Start Date",
    endDate: "End Date",
    apply: "Apply",
    selectDate: "Select date",
  },
  vi: {
    reportType: "Loại báo cáo",
    daily: "Hàng ngày",
    weekly: "Hàng tuần",
    monthly: "Hàng tháng",
    custom: "Tùy chỉnh",
    startDate: "Ngày bắt đầu",
    endDate: "Ngày kết thúc",
    apply: "Áp dụng",
    selectDate: "Chọn ngày",
  },
}

interface ReportFiltersProps {
  onFilterChange: (filters: any) => void
}

export function ReportFilters({ onFilterChange }: ReportFiltersProps) {
  const { language } = useLanguage()
  const t = translations[language]
  
  const [reportType, setReportType] = useState(REPORT_TYPES.WEEKLY)
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  )
  const [endDate, setEndDate] = useState<Date | undefined>(new Date())
  
  const handleReportTypeChange = (value: string) => {
    setReportType(value)
    
    // Automatically update date range based on report type
    const now = new Date()
    let start = new Date()
    
    switch (value) {
      case REPORT_TYPES.DAILY:
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000) // 1 day ago
        break
      case REPORT_TYPES.WEEKLY:
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
        break
      case REPORT_TYPES.MONTHLY:
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
        break
      case REPORT_TYPES.CUSTOM:
        // Keep current dates for custom
        break
    }
    
    if (value !== REPORT_TYPES.CUSTOM) {
      setStartDate(start)
      setEndDate(now)
      
      // Notify parent component of changes
      onFilterChange({
        reportType: value,
        timeRange: {
          start,
          end: now,
        },
      })
    }
  }
  
  const handleApplyCustomDates = () => {
    if (startDate && endDate) {
      onFilterChange({
        reportType,
        timeRange: {
          start: startDate,
          end: endDate,
        },
      })
    }
  }
  
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={reportType}
        onValueChange={handleReportTypeChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={t.reportType} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={REPORT_TYPES.DAILY}>{t.daily}</SelectItem>
          <SelectItem value={REPORT_TYPES.WEEKLY}>{t.weekly}</SelectItem>
          <SelectItem value={REPORT_TYPES.MONTHLY}>{t.monthly}</SelectItem>
          <SelectItem value={REPORT_TYPES.CUSTOM}>{t.custom}</SelectItem>
        </SelectContent>
      </Select>
      
      {reportType === REPORT_TYPES.CUSTOM && (
        <>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[180px] justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "dd/MM/yyyy") : t.startDate}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[180px] justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "dd/MM/yyyy") : t.endDate}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          <Button onClick={handleApplyCustomDates}>{t.apply}</Button>
        </>
      )}
    </div>
  )
}

