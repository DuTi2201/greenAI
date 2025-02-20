"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { alertService, type Alert } from "@/lib/services/alert.service"
import { Skeleton } from "@/components/ui/skeleton"

const alertIcons = {
  warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  error: <XCircle className="h-5 w-5 text-red-500" />,
  success: <CheckCircle className="h-5 w-5 text-green-500" />,
}

export default function AlertHistory() {
  const { data: alerts, isLoading } = useQuery<Alert[]>({
    queryKey: ['alerts'],
    queryFn: () => alertService.getAll(),
    refetchInterval: 10000,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Lịch sử thông báo</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-5 w-5 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-3 w-[100px]" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {alerts && alerts.length > 0 ? (
              alerts.map((alert) => (
                <div key={alert.id} className="flex items-start space-x-4">
                  {alertIcons[alert.type]}
                  <div>
                    <p className={`text-sm ${alert.read ? "text-muted-foreground" : "font-medium"}`}>
                      {alert.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(alert.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center">Không có thông báo</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

