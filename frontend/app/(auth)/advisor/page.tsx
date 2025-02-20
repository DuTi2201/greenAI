"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { RefreshCw } from "lucide-react"
import { advisorService } from "@/lib/services/advisor.service"
import { deviceService } from "@/lib/services/device.service"
import { RadialProgress } from "@/components/ui/radial-progress"
import { RadarChart } from "@/components/ui/radar-chart"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdvisorPage() {
  const queryClient = useQueryClient()

  const { data: advisor, isLoading, refetch } = useQuery({
    queryKey: ['advisor'],
    queryFn: () => advisorService.analyze(),
    refetchInterval: 60000, // Tự động cập nhật mỗi phút
  })

  const controlMutation = useMutation({
    mutationFn: ({ deviceId, action }: { deviceId: string; action: 'on' | 'off' }) =>
      deviceService.control(deviceId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      toast.success('Đã cập nhật trạng thái thiết bị')
    },
    onError: (error) => {
      console.error('Lỗi khi điều khiển thiết bị:', error)
      toast.error('Không thể cập nhật trạng thái thiết bị')
    },
  })

  // Dữ liệu cho biểu đồ radar
  const radarData = advisor?.sensorData ? [
    {
      subject: 'Nhiệt độ',
      value: Math.min(advisor.sensorData.temperature, 40), // Giới hạn ở 40°C
      fullMark: 40,
    },
    {
      subject: 'Độ ẩm đất',
      value: advisor.sensorData.soilMoisture,
      fullMark: 100,
    },
    {
      subject: 'Ánh sáng',
      value: Math.min(advisor.sensorData.light, 1000), // Giới hạn ở 1000 Lux
      fullMark: 1000,
    },
    {
      subject: 'Độ ẩm KK',
      value: advisor.sensorData.humidity,
      fullMark: 100,
    },
  ] : []

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">AI Garden Advisor</h1>
        <Button onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Phân tích lại
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sức khỏe cây trồng */}
        <Card>
          <CardHeader>
            <CardTitle>Sức khỏe cây trồng</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            {isLoading ? (
              <Skeleton className="h-[200px] w-[200px] rounded-full" />
            ) : (
              <RadialProgress
                value={advisor?.healthScore || 0}
                size={200}
                strokeWidth={20}
                className="text-green-500"
              />
            )}
          </CardContent>
        </Card>

        {/* So sánh chỉ số */}
        <Card>
          <CardHeader>
            <CardTitle>So sánh chỉ số</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : advisor?.sensorData ? (
              <RadarChart data={radarData} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Không có dữ liệu cảm biến
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Đề xuất */}
      <Card>
        <CardHeader>
          <CardTitle>⭐ Đề xuất</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[300px]" />
                  </div>
                  <Skeleton className="h-6 w-10" />
                </div>
              ))}
            </div>
          ) : advisor?.recommendations && advisor.recommendations.length > 0 ? (
            advisor.recommendations.map((rec) => (
              <div key={rec.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <p className="font-medium">{rec.title}</p>
                  <p className="text-sm text-muted-foreground">{rec.description}</p>
                  {rec.duration && (
                    <p className="text-xs text-muted-foreground">
                      Thời gian đề xuất: {Math.round(rec.duration / 60)} phút
                    </p>
                  )}
                </div>
                <Switch
                  checked={rec.success || false}
                  onCheckedChange={(checked) => {
                    if (rec.device && rec.action) {
                      controlMutation.mutate({
                        deviceId: rec.device,
                        action: rec.action,
                      })
                    }
                  }}
                  disabled={!rec.device || !rec.action || controlMutation.isPending}
                />
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              Mọi thông số đều ổn định. Không có đề xuất nào tại thời điểm này.
            </div>
          )}

          {advisor?.analysis && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm">🤖 Gemini phân tích:</p>
              <p className="text-sm text-muted-foreground mt-1">{advisor.analysis}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

