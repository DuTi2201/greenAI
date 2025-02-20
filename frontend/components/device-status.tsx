"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Droplet, Sun, Fan, FlaskConical } from "lucide-react"
import { deviceService } from "@/lib/services/device.service"
import { Skeleton } from "@/components/ui/skeleton"

const deviceIcons = {
  pump: Droplet,
  led: Sun,
  fan: Fan,
  nutrient: FlaskConical,
}

export default function DeviceStatus() {
  const queryClient = useQueryClient()
  
  const { data: devices, isLoading, error } = useQuery({
    queryKey: ['devices'],
    queryFn: () => deviceService.getAll(),
    refetchInterval: 5000,
  })

  const controlMutation = useMutation({
    mutationFn: ({ deviceId, action }: { deviceId: string; action: 'on' | 'off' }) =>
      deviceService.control(deviceId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
    },
  })

  if (error) {
    return <div className="text-red-500">Error loading devices</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Device Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-6 w-10" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))
          ) : (
            devices?.map((device) => {
              const Icon = deviceIcons[device.type as keyof typeof deviceIcons] || Sun
              return (
                <div key={device.id} className="flex items-center space-x-4">
                  <Switch
                    checked={device.status === 'on'}
                    onCheckedChange={(checked) =>
                      controlMutation.mutate({
                        deviceId: device.id,
                        action: checked ? 'on' : 'off',
                      })
                    }
                    disabled={!device.isActive || controlMutation.isPending}
                  />
                  <div className="flex items-center space-x-2">
                    <Icon className={`h-5 w-5 ${device.status === 'on' ? "text-green-500" : "text-red-500"}`} />
                    <span className="text-sm font-medium">{device.name}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}

