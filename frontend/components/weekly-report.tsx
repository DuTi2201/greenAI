"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { reportService } from "@/lib/services/report.service"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { Button } from "@/components/ui/button"
import { Mail } from "lucide-react"

export default function WeeklyReport() {
  const { data: report, isLoading, error } = useQuery({
    queryKey: ['weeklyReport'],
    queryFn: () => reportService.getWeeklyReport(),
    refetchInterval: 300000, // Cập nhật mỗi 5 phút
  })

  const handleSendEmail = async () => {
    try {
      await reportService.sendWeeklyReportEmail()
      // TODO: Hiển thị thông báo thành công
    } catch (error) {
      // TODO: Hiển thị thông báo lỗi
    }
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Báo cáo tuần</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTitle>Lỗi</AlertTitle>
            <AlertDescription>
              Không thể tải dữ liệu báo cáo. Vui lòng thử lại sau.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Báo cáo tuần</CardTitle>
          {!isLoading && report && (
            <p className="text-sm text-muted-foreground">
              {new Date(report.startDate).toLocaleDateString('vi-VN')} - {new Date(report.endDate).toLocaleDateString('vi-VN')}
            </p>
          )}
        </div>
        <Button variant="outline" onClick={handleSendEmail}>
          <Mail className="mr-2 h-4 w-4" />
          Gửi qua email
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-8">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        ) : report ? (
          <Tabs defaultValue="energy" className="space-y-4">
            <TabsList>
              <TabsTrigger value="energy">Năng lượng</TabsTrigger>
              <TabsTrigger value="water">Nước</TabsTrigger>
              <TabsTrigger value="sensors">Cảm biến</TabsTrigger>
            </TabsList>

            <TabsContent value="energy" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Điện năng tiêu thụ</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={report.energyUsage?.byDevice || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="deviceName" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="powerUsage" fill="#3b82f6" name="Điện năng (kWh)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4">
                      <div className="text-2xl font-bold">
                        {report.energyUsage?.total ? `${report.energyUsage.total.toFixed(2)} kWh` : 'N/A'}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {report.energyUsage?.previousWeek ? 
                          `${((report.energyUsage.total - report.energyUsage.previousWeek) / report.energyUsage.previousWeek * 100).toFixed(1)}% so với tuần trước` 
                          : 'Chưa có dữ liệu tuần trước'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Dự đoán tiêu thụ</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {report.energyUsage?.prediction ? `${report.energyUsage.prediction.toFixed(2)} kWh` : 'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Dự đoán cho tuần tới
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="water" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Nước tiêu thụ</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={report.waterUsage?.byPump || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="pumpName" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="liters" fill="#10b981" name="Nước (lít)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4">
                      <div className="text-2xl font-bold">
                        {report.waterUsage?.total ? `${report.waterUsage.total.toFixed(2)} lít` : 'N/A'}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {report.waterUsage?.previousWeek ? 
                          `${((report.waterUsage.total - report.waterUsage.previousWeek) / report.waterUsage.previousWeek * 100).toFixed(1)}% so với tuần trước`
                          : 'Chưa có dữ liệu tuần trước'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Dự đoán tiêu thụ</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {report.waterUsage?.prediction ? `${report.waterUsage.prediction.toFixed(2)} lít` : 'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Dự đoán cho tuần tới
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="sensors" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {report.sensorStats?.map((sensor) => (
                  <Card key={sensor.sensorId}>
                    <CardHeader>
                      <CardTitle className="text-sm">{sensor.sensorName}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {sensor.accuracy ? `${sensor.accuracy.toFixed(1)}%` : 'N/A'}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {`${sensor.readings || 0} lần đọc • ${sensor.uptime ? sensor.uptime.toFixed(1) : 0}% uptime`}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            Không có dữ liệu báo cáo
          </div>
        )}

        {report?.recommendations && report.recommendations.length > 0 && (
          <Alert className="mt-8">
            <AlertTitle>Đề xuất tối ưu</AlertTitle>
            <AlertDescription>
              <div className="mt-2 space-y-2">
                <ul className="list-disc list-inside space-y-2">
                  {report.recommendations.map((rec, index: number) => (
                    <li key={index}>
                      <div className="font-medium">{rec.title}</div>
                      <p className="text-sm text-muted-foreground">{rec.description}</p>
                      {rec.savings && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Tiết kiệm dự kiến: 
                          {rec.savings.energy && ` ${rec.savings.energy} kWh điện`}
                          {rec.savings.energy && rec.savings.water && ' • '}
                          {rec.savings.water && ` ${rec.savings.water} lít nước`}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

