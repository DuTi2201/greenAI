"use client"

import { useLanguage } from "@/providers/language-provider"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Download } from "lucide-react"

const translations = {
  en: {
    device: "Device",
    reportType: "Report Type",
    dateRange: "Date Range",
    export: "Export",
    selectDate: "Select date",
  },
  vi: {
    device: "Thiết bị",
    reportType: "Loại Báo cáo",
    dateRange: "Khoảng thời gian",
    export: "Xuất báo cáo",
    selectDate: "Chọn ngày",
  },
}

type ReportFiltersProps = {
  onFilterChange: (filters: any) => void
}

export function ReportFilters({ onFilterChange }: ReportFiltersProps) {
  const { language } = useLanguage()
  const t = translations[language]

  return (
    <div className="flex flex-wrap gap-4 items-center">
      <Select onValueChange={(value) => onFilterChange({ device: value })}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder={t.device} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="device1">Garden Sensor 1</SelectItem>
          <SelectItem value="device2">Garden Sensor 2</SelectItem>
        </SelectContent>
      </Select>

      <Select onValueChange={(value) => onFilterChange({ type: value })}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder={t.reportType} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="daily">Daily Report</SelectItem>
          <SelectItem value="weekly">Weekly Report</SelectItem>
          <SelectItem value="monthly">Monthly Report</SelectItem>
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {t.dateRange}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar mode="range" numberOfMonths={2} onSelect={(range) => onFilterChange({ dateRange: range })} />
        </PopoverContent>
      </Popover>

      <Button variant="outline">
        <Download className="mr-2 h-4 w-4" />
        {t.export}
      </Button>
    </div>
  )
}

