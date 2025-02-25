"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GardenManager } from "@/components/settings/garden-manager"
import { ProfileSettings } from "@/components/settings/profile-settings"
import { AppearanceSettings } from "@/components/settings/appearance-settings"
import { NotificationSettings } from "@/components/settings/notification-settings"
import { useLanguage } from "@/providers/language-provider"

const translations = {
  en: {
    title: "Settings",
    gardens: "Gardens",
    profile: "Profile",
    appearance: "Appearance",
    notifications: "Notifications",
  },
  vi: {
    title: "Cài đặt",
    gardens: "Quản lý vườn",
    profile: "Hồ sơ",
    appearance: "Giao diện",
    notifications: "Thông báo",
  },
}

export default function SettingsPage() {
  const { language } = useLanguage()
  const t = translations[language]

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">{t.title}</h1>

      <Tabs defaultValue="gardens" className="space-y-6">
        <TabsList>
          <TabsTrigger value="gardens">{t.gardens}</TabsTrigger>
          <TabsTrigger value="profile">{t.profile}</TabsTrigger>
          <TabsTrigger value="appearance">{t.appearance}</TabsTrigger>
          <TabsTrigger value="notifications">{t.notifications}</TabsTrigger>
        </TabsList>

        <TabsContent value="gardens">
          <Card>
            <CardHeader>
              <CardTitle>{t.gardens}</CardTitle>
            </CardHeader>
            <CardContent>
              <GardenManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>{t.profile}</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfileSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>{t.appearance}</CardTitle>
            </CardHeader>
            <CardContent>
              <AppearanceSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>{t.notifications}</CardTitle>
            </CardHeader>
            <CardContent>
              <NotificationSettings />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

