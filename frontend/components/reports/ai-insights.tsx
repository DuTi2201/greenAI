"use client"

import { useLanguage } from "@/providers/language-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Lightbulb, TrendingUp, AlertTriangle, Leaf } from "lucide-react"

const translations = {
  en: {
    title: "AI Insights",
    healthScore: "Garden Health Score",
    noInsights: "No insights available",
    excellent: "Excellent",
    good: "Good",
    fair: "Fair",
    poor: "Poor"
  },
  vi: {
    title: "Phân tích AI",
    healthScore: "Điểm sức khỏe vườn",
    noInsights: "Không có phân tích",
    excellent: "Xuất sắc",
    good: "Tốt",
    fair: "Trung bình",
    poor: "Kém"
  },
}

interface AIInsightsProps {
  insights: string[];
  healthScore: number;
}

export function AIInsights({ insights = [], healthScore = 0 }: AIInsightsProps) {
  const { language } = useLanguage()
  const t = translations[language]

  const getHealthScoreText = (score: number) => {
    if (score >= 80) return t.excellent
    if (score >= 60) return t.good
    if (score >= 40) return t.fair
    return t.poor
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500"
    if (score >= 60) return "bg-blue-500"
    if (score >= 40) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getInsightIcon = (index: number) => {
    const icons = [
      <Lightbulb key="lightbulb" className="h-4 w-4 text-yellow-500" />,
      <TrendingUp key="trending" className="h-4 w-4 text-blue-500" />,
      <AlertTriangle key="alert" className="h-4 w-4 text-red-500" />,
      <Leaf key="leaf" className="h-4 w-4 text-green-500" />
    ]
    return icons[index % icons.length]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          {t.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">{t.healthScore}</span>
            <span className="text-sm font-medium">{healthScore}% - {getHealthScoreText(healthScore)}</span>
          </div>
          <Progress value={healthScore} className={getHealthScoreColor(healthScore)} />
        </div>

        {insights.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            {t.noInsights}
          </div>
        ) : (
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="mt-0.5">
                  {getInsightIcon(index)}
                </div>
                <p className="text-sm">{insight}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

