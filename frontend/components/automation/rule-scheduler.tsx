"use client"

import { useLanguage } from "@/providers/language-provider"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"

const translations = {
  en: {
    viewMode: "View Mode",
    modes: {
      day: "Day",
      week: "Week",
      month: "Month",
    },
    activeRules: "Active Rules",
    noRules: "No rules scheduled for this date",
  },
  vi: {
    viewMode: "Chế độ xem",
    modes: {
      day: "Ngày",
      week: "Tuần",
      month: "Tháng",
    },
    activeRules: "Quy tắc đang hoạt động",
    noRules: "Không có quy tắc nào được lên lịch cho ngày này",
  },
}

type Rule = {
  id: string
  name: string
  deviceName: string
  condition: string
  action: string
  schedule?: string
  isActive: boolean
}

type RuleSchedulerProps = {
  rules: Rule[]
}

export function RuleScheduler({ rules }: RuleSchedulerProps) {
  const { language } = useLanguage()
  const t = translations[language]
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week")

  const activeRules = rules.filter((rule) => rule.isActive && rule.schedule)

  return (
    <div className="grid gap-4">
      <div className="flex justify-between items-center">
        <Select value={viewMode} onValueChange={(value: "day" | "week" | "month") => setViewMode(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t.viewMode} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">{t.modes.day}</SelectItem>
            <SelectItem value="week">{t.modes.week}</SelectItem>
            <SelectItem value="month">{t.modes.month}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid md:grid-cols-[auto,300px] gap-4">
        <Card>
          <CardContent className="p-3">
            <Calendar mode={viewMode} selected={date} onSelect={setDate} className="rounded-md border" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-3">{t.activeRules}</h3>
            <ScrollArea className="h-[300px]">
              {activeRules.length > 0 ? (
                <div className="space-y-2">
                  {activeRules.map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between p-2 rounded-lg border">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{rule.name}</p>
                        <p className="text-xs text-muted-foreground">{rule.schedule}</p>
                      </div>
                      <Badge variant="outline">{rule.deviceName}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t.noRules}</p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

