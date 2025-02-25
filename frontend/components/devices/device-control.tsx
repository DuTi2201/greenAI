"use client"

import { useLanguage } from "@/providers/language-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Fan, Power, Droplets, FlaskRound, Lightbulb } from "lucide-react"

const translations = {
  en: {
    controls: "Device Controls",
    fan: "Fan",
    pump: "Water Pump",
    led: "LED Lights",
    nutrientPump: "Nutrient Pump",
    on: "On",
    off: "Off",
  },
  vi: {
    controls: "Điều khiển Thiết bị",
    fan: "Quạt",
    pump: "Máy bơm",
    led: "Đèn LED",
    nutrientPump: "Máy bơm dinh dưỡng",
    on: "Bật",
    off: "Tắt",
  },
}

type DeviceControlProps = {
  deviceId: string
  gardenName: string
  onControl: (deviceId: string, type: string, state: boolean) => void
  status: {
    fan: boolean
    pump: boolean
    led: boolean
    nutrientPump: boolean
  }
}

export function DeviceControl({ deviceId, gardenName, onControl, status }: DeviceControlProps) {
  const { language } = useLanguage()
  const t = translations[language]

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {gardenName} - {t.controls}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="flex flex-col items-center gap-2">
          <Fan className="mr-2 h-4 w-4" />
          <span className="text-sm font-medium">{t.fan}</span>
          <Button
            variant={status.fan ? "default" : "outline"}
            size="lg"
            className="w-full"
            onClick={() => onControl(deviceId, "fan", !status.fan)}
          >
            <Power className="mr-2 h-4 w-4" />
            {status.fan ? t.on : t.off}
          </Button>
        </div>

        <div className="flex flex-col items-center gap-2">
          <Droplets className="mr-2 h-4 w-4" />
          <span className="text-sm font-medium">{t.pump}</span>
          <Button
            variant={status.pump ? "default" : "outline"}
            size="lg"
            className="w-full"
            onClick={() => onControl(deviceId, "pump", !status.pump)}
          >
            <Power className="mr-2 h-4 w-4" />
            {status.pump ? t.on : t.off}
          </Button>
        </div>

        <div className="flex flex-col items-center gap-2">
          <Lightbulb className="mr-2 h-4 w-4" />
          <span className="text-sm font-medium">{t.led}</span>
          <Button
            variant={status.led ? "default" : "outline"}
            size="lg"
            className="w-full"
            onClick={() => onControl(deviceId, "led", !status.led)}
          >
            <Power className="mr-2 h-4 w-4" />
            {status.led ? t.on : t.off}
          </Button>
        </div>

        <div className="flex flex-col items-center gap-2">
          <FlaskRound className="mr-2 h-4 w-4" />
          <span className="text-sm font-medium">{t.nutrientPump}</span>
          <Button
            variant={status.nutrientPump ? "default" : "outline"}
            size="lg"
            className="w-full"
            onClick={() => onControl(deviceId, "nutrientPump", !status.nutrientPump)}
          >
            <Power className="mr-2 h-4 w-4" />
            {status.nutrientPump ? t.on : t.off}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

