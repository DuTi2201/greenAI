"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import type { Recommendation } from "./advisor-content"

interface AIRecommendationsProps {
  recommendations: Recommendation[]
  onApplyAll: () => void
  loading: boolean
}

export default function AIRecommendations({ recommendations, onApplyAll, loading }: AIRecommendationsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>🌟 Đề xuất</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <div key={index} className="flex items-start justify-between gap-4 p-4 bg-muted rounded-lg">
              <div className="space-y-1">
                <h3 className="font-medium">{rec.title}</h3>
                <p className="text-sm text-muted-foreground">{rec.description}</p>
              </div>
              <Switch />
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-primary/10 rounded-lg">
            <h3 className="font-medium mb-2">🤖 Gemini phân tích:</h3>
            <p className="text-sm">
              "Cây đang thiếu ánh sáng trầm trọng, cần bổ sung đèn LED để kích thích quang hợp. Đồng thời, độ ẩm đất
              đang ở mức thấp, cần tưới nước ngay để tránh cây bị stress."
            </p>
          </div>

          <Button className="w-full" onClick={onApplyAll} disabled={loading}>
            {loading ? "Đang áp dụng..." : "Áp dụng tất cả"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

