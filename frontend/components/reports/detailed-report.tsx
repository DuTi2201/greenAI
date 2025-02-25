"use client"

import { useLanguage } from "@/providers/language-provider"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, Eye } from "lucide-react"

const translations = {
  en: {
    title: "Detailed Report",
    timestamp: "Time",
    temperature: "Temperature",
    humidity: "Humidity",
    soilMoisture: "Soil Moisture",
    light: "Light",
    status: "Status",
    actions: "Actions",
    view: "View",
    download: "Download",
    statuses: {
      normal: "Normal",
      warning: "Warning",
      critical: "Critical",
    },
  },
  vi: {
    title: "Báo cáo Chi tiết",
    timestamp: "Thời gian",
    temperature: "Nhiệt độ",
    humidity: "Độ ẩm",
    soilMoisture: "Độ ẩm đất",
    light: "Ánh sáng",
    status: "Trạng thái",
    actions: "Thao tác",
    view: "Xem",
    download: "Tải xuống",
    statuses: {
      normal: "Bình thường",
      warning: "Cảnh báo",
      critical: "Nguy hiểm",
    },
  },
}

type DetailedReportProps = {
  data: {
    timestamp: string
    temperature: number
    humidity: number
    soilMoisture: number
    light: number
  }[]
}

export function DetailedReport({ data }: DetailedReportProps) {
  const { language } = useLanguage()
  const t = translations[language]

  const getStatus = (temperature: number, humidity: number) => {
    if (temperature > 35 || humidity < 30) return "critical"
    if (temperature > 30 || humidity < 40) return "warning"
    return "normal"
  }

  const getStatusBadge = (status: "normal" | "warning" | "critical") => {
    const variants = {
      normal: "default",
      warning: "warning",
      critical: "destructive",
    }
    return <Badge variant={variants[status]}>{t.statuses[status]}</Badge>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.timestamp}</TableHead>
              <TableHead>{t.temperature}</TableHead>
              <TableHead>{t.humidity}</TableHead>
              <TableHead>{t.soilMoisture}</TableHead>
              <TableHead>{t.light}</TableHead>
              <TableHead>{t.status}</TableHead>
              <TableHead className="text-right">{t.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => {
              const status = getStatus(row.temperature, row.humidity)
              return (
                <TableRow key={index}>
                  <TableCell>{row.timestamp}</TableCell>
                  <TableCell>{row.temperature.toFixed(1)}°C</TableCell>
                  <TableCell>{row.humidity.toFixed(1)}%</TableCell>
                  <TableCell>{row.soilMoisture.toFixed(1)}%</TableCell>
                  <TableCell>{row.light.toFixed(0)} lx</TableCell>
                  <TableCell>{getStatusBadge(status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

