"use client"

import { useLanguage } from "@/providers/language-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, TrendingUp, Brain } from "lucide-react"

const translations = {
  en: {
    title: "AI Insights",
    anomalies: "Anomalies Detected",
    optimization: "Optimization Suggestions",
    health: "Garden Health Score",
  },
  vi: {
    title: "Phân tích AI",
    anomalies: "Phát hiện Bất thường",
    optimization: "Gợi ý Tối ưu hóa",
    health: "Điểm Sức khỏe Vườn",
  },
}

type Insight = {
  type: "warning" | "success" | "info"
  message: string
}

type AIInsightsProps = {
  insights: Insight[]
  healthScore: number
}

export function AIInsights({ insights, healthScore }: AIInsightsProps) {
  const { language } = useLanguage()
  const t = translations[language]

  const getIcon = (type: Insight["type"]) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "info":
        return <TrendingUp className="h-4 w-4 text-blue-500" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          {t.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <div key={index} className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
              {getIcon(insight.type)}
              <p className="text-sm">{insight.message}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{t.health}</span>
          <Badge variant={healthScore > 70 ? "default" : "destructive"} className="text-lg px-4 py-1">
            {healthScore}%
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

