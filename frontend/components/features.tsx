"use client"

import { useLanguage } from "@/providers/language-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Zap, Brain, BarChart } from "lucide-react"

export function Features() {
  const { language } = useLanguage()

  const features = {
    en: [
      {
        title: "Real-time Monitoring",
        description: "Track sensor data (temperature, humidity, light) in real-time",
        icon: Activity,
      },
      {
        title: "Remote Control",
        description: "Control devices (fans, LEDs, pumps) from anywhere",
        icon: Zap,
      },
      {
        title: "Smart Automation",
        description: "Configure automated rules based on sensor data",
        icon: Brain,
      },
      {
        title: "AI Analysis & Reports",
        description: "Get automated reports with optimization suggestions from Gemini API",
        icon: BarChart,
      },
    ],
    vi: [
      {
        title: "Giám sát Thời gian thực",
        description: "Theo dõi dữ liệu cảm biến (nhiệt độ, độ ẩm, ánh sáng) theo thời gian thực",
        icon: Activity,
      },
      {
        title: "Điều khiển Từ xa",
        description: "Điều khiển thiết bị (quạt, đèn LED, máy bơm) từ mọi nơi",
        icon: Zap,
      },
      {
        title: "Tự động hóa Thông minh",
        description: "Cấu hình quy tắc tự động dựa trên dữ liệu cảm biến",
        icon: Brain,
      },
      {
        title: "Phân tích AI & Báo cáo",
        description: "Nhận báo cáo tự động với gợi ý tối ưu từ Gemini API",
        icon: BarChart,
      },
    ],
  }

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features[language].map((feature, index) => (
            <Card key={index} className="transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <feature.icon className="w-12 h-12 text-primary mb-4" />
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

