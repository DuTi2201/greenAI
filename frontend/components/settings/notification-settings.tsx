"use client"

import { useLanguage } from "@/providers/language-provider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Bell, Mail, MessageSquare } from "lucide-react"

const translations = {
  en: {
    notifications: {
      email: "Email Notifications",
      push: "Push Notifications",
      inApp: "In-App Notifications",
    },
    frequency: "Notification Frequency",
    frequencies: {
      immediately: "Immediately",
      daily: "Daily Summary",
      weekly: "Weekly Summary",
    },
    types: {
      alerts: "System Alerts",
      reports: "Reports",
      updates: "System Updates",
    },
  },
  vi: {
    notifications: {
      email: "Thông báo qua Email",
      inApp: "Thông báo trong Ứng dụng",
    },
    frequency: "Tần suất Thông báo",
    frequencies: {
      immediately: "Ngay lập tức",
      daily: "Tổng hợp Hàng ngày",
      weekly: "Tổng hợp Hàng tuần",
    },
    types: {
      alerts: "Cảnh báo Hệ thống",
      reports: "Báo cáo",
      updates: "Cập nhật Hệ thống",
    },
  },
}

export function NotificationSettings() {
  const { language } = useLanguage()
  const t = translations[language]

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Mail className="h-5 w-5 text-primary" />
              <Label htmlFor="email-notifications">{t.notifications.email}</Label>
            </div>
            <Switch id="email-notifications" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Bell className="h-5 w-5 text-primary" />
              <Label htmlFor="inapp-notifications">{t.notifications.inApp}</Label>
            </div>
            <Switch id="inapp-notifications" />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        <Label>{t.frequency}</Label>
        <Select defaultValue="immediately">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="immediately">{t.frequencies.immediately}</SelectItem>
            <SelectItem value="daily">{t.frequencies.daily}</SelectItem>
            <SelectItem value="weekly">{t.frequencies.weekly}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <Label>Notification Types</Label>
        <div className="grid gap-2">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <Label htmlFor="alerts">{t.types.alerts}</Label>
              <Switch id="alerts" defaultChecked />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <Label htmlFor="reports">{t.types.reports}</Label>
              <Switch id="reports" defaultChecked />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <Label htmlFor="updates">{t.types.updates}</Label>
              <Switch id="updates" defaultChecked />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

