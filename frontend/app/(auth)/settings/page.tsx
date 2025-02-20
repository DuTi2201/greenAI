"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/lib/hooks/use-auth"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { userService } from "@/lib/services/user.service"
import type { NotificationSettings } from "@/lib/services/user.service"
import { WemosConfig } from "@/components/settings/WemosConfig"

export default function SettingsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email: false,
    push: false,
    sms: false
  })
  const [loading, setLoading] = useState(false)
  const [loadingNotifications, setLoadingNotifications] = useState(true)

  useEffect(() => {
    loadNotificationSettings()
  }, [])

  const loadNotificationSettings = async () => {
    try {
      const settings = await userService.getNotificationSettings()
      setNotifications(settings)
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể tải cài đặt thông báo")
    } finally {
      setLoadingNotifications(false)
    }
  }

  const handleNotificationChange = async (key: keyof NotificationSettings) => {
    const newSettings = {
      ...notifications,
      [key]: !notifications[key]
    }
    
    try {
      setNotifications(newSettings)
      await userService.updateNotificationSettings(newSettings)
      toast.success("Đã cập nhật cài đặt thông báo")
    } catch (error: any) {
      // Hoàn tác thay đổi nếu lỗi
      setNotifications(notifications)
      toast.error(error.response?.data?.message || "Không thể cập nhật cài đặt thông báo")
    }
  }

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const form = e.currentTarget
    const currentPassword = form.currentPassword.value
    const newPassword = form.newPassword.value
    const confirmPassword = form.confirmPassword.value

    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu mới không khớp")
      setLoading(false)
      return
    }

    if (newPassword.length < 8) {
      toast.error("Mật khẩu mới phải có ít nhất 8 ký tự")
      setLoading(false)
      return
    }

    try {
      await userService.updatePassword({
        currentPassword,
        newPassword
      })
      toast.success("Đã đổi mật khẩu thành công")
      form.reset()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể đổi mật khẩu")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      
      <Tabs defaultValue="wemos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="wemos">Wemos D1</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="wemos">
          <WemosConfig />
        </TabsContent>

        <TabsContent value="general">
          <Card>
            {/* General settings content */}
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Tùy chọn thông báo</CardTitle>
              <CardDescription>
                Chọn cách bạn muốn nhận thông báo từ hệ thống
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingNotifications ? (
                <div className="text-center text-muted-foreground">
                  Đang tải cài đặt thông báo...
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-notifications">Thông báo qua email</Label>
                      <p className="text-sm text-muted-foreground">
                        Nhận thông báo qua email của bạn
                      </p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={notifications.email}
                      onCheckedChange={() => handleNotificationChange("email")}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="push-notifications">Thông báo đẩy</Label>
                      <p className="text-sm text-muted-foreground">
                        Nhận thông báo trực tiếp trên trình duyệt
                      </p>
                    </div>
                    <Switch
                      id="push-notifications"
                      checked={notifications.push}
                      onCheckedChange={() => handleNotificationChange("push")}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="sms-notifications">Thông báo qua SMS</Label>
                      <p className="text-sm text-muted-foreground">
                        Nhận thông báo qua tin nhắn SMS
                      </p>
                    </div>
                    <Switch
                      id="sms-notifications"
                      checked={notifications.sms}
                      onCheckedChange={() => handleNotificationChange("sms")}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

