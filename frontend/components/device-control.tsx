"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Droplet, Sun, Fan, FlaskConical } from "lucide-react"
import { deviceService } from "@/lib/services/device.service"
import { Device } from "@/lib/services/device.service"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"

const deviceIcons = {
  pump: Droplet,
  led: Sun,
  fan: Fan,
  nutrient: FlaskConical,
}

export default function DeviceControl() {
  const queryClient = useQueryClient()

  const { data: devices, isLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: () => deviceService.getAll(),
    refetchInterval: 5000,
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

  if (isLoading) {
    return <div>Đang tải...</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {devices?.filter(device => device.type !== 'sensor').map((device) => {
        const Icon = deviceIcons[device.type === 'pump' && device.name.toLowerCase().includes('nutrient') ? 'nutrient' : device.type as keyof typeof deviceIcons] || Sun

        return (
          <Card key={device.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{device.name}</CardTitle>
              <Icon className={`h-5 w-5 ${device.status === 'on' ? 'text-green-500' : 'text-gray-500'}`} />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Switch
                  checked={device.status === 'on'}
                  onCheckedChange={(checked) => {
                    controlMutation.mutate({
                      deviceId: device.id,
                      action: checked ? 'on' : 'off',
                    })
                  }}
                  disabled={!device.isActive || controlMutation.isPending}
                />
                <span className={`text-sm ${device.status === 'on' ? 'text-green-500' : 'text-gray-500'}`}>
                  {device.status === 'on' ? 'ON' : 'OFF'}
                </span>
              </div>
              {device.lastAction && (
                <div className="mt-2 text-sm text-muted-foreground">
                  Lần cuối hoạt động: {formatDistanceToNow(new Date(device.lastAction.timestamp), { addSuffix: true, locale: vi })}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

