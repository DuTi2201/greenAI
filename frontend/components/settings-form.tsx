"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export default function SettingsForm() {
  const [notifications, setNotifications] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [dataInterval, setDataInterval] = useState("5")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically handle saving the settings
    console.log("Saving settings:", { notifications, emailNotifications, dataInterval })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications" className="flex flex-col space-y-1">
                <span>Push Notifications</span>
                <span className="font-normal text-sm text-muted-foreground">Receive notifications on your device</span>
              </Label>
              <Switch id="notifications" checked={notifications} onCheckedChange={setNotifications} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notifications" className="flex flex-col space-y-1">
                <span>Email Notifications</span>
                <span className="font-normal text-sm text-muted-foreground">Receive notifications via email</span>
              </Label>
              <Switch id="email-notifications" checked={emailNotifications} onCheckedChange={setEmailNotifications} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data-interval">Data Update Interval (minutes)</Label>
              <Input
                id="data-interval"
                type="number"
                min="1"
                max="60"
                value={dataInterval}
                onChange={(e) => setDataInterval(e.target.value)}
              />
            </div>
          </div>
          <Button type="submit">Save Settings</Button>
        </form>
      </CardContent>
    </Card>
  )
}

