"use client"

import { useLanguage } from "@/providers/language-provider"
import Image from "next/image"

export function About() {
  const { language } = useLanguage()

  const content = {
    en: {
      title: "About Smart Garden System",
      description:
        "Our smart garden system combines IoT technology with artificial intelligence to revolutionize garden management. We provide real-time monitoring, automated control, and intelligent insights to help you maintain your garden efficiently.",
      vision: "Our Vision",
      visionText:
        "To make smart garden technology accessible to everyone, promoting sustainable and efficient garden management practices.",
      timeline: ["Research and Development", "IoT Integration", "AI Implementation", "System Launch"],
    },
    vi: {
      title: "Về Hệ thống Vườn Thông minh",
      description:
        "Hệ thống vườn thông minh của chúng tôi kết hợp công nghệ IoT với trí tuệ nhân tạo để cách mạng hóa việc quản lý vườn. Chúng tôi cung cấp giám sát thời gian thực, kiểm soát tự động và những hiểu biết thông minh để giúp bạn duy trì vườn một cách hiệu quả.",
      vision: "Tầm nhìn",
      visionText:
        "Làm cho công nghệ vườn thông minh trở nên dễ tiếp cận với mọi người, thúc đẩy các phương pháp quản lý vườn bền vững và hiệu quả.",
      timeline: ["Nghiên cứu và Phát triển", "Tích hợp IoT", "Triển khai AI", "Ra mắt Hệ thống"],
    },
  }

  const t = content[language]

  return (
    <section className="py-16 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">{t.title}</h2>
            <p className="text-lg text-muted-foreground mb-8">{t.description}</p>
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">{t.vision}</h3>
              <p className="text-muted-foreground">{t.visionText}</p>
            </div>
          </div>
          <div className="relative">
            <Image
              src="/placeholder.svg"
              alt="Smart Garden System"
              width={600}
              height={400}
              className="rounded-lg shadow-lg"
            />
            <div className="mt-8">
              <div className="flex justify-between">
                {t.timeline.map((step, index) => (
                  <div key={index} className="flex flex-col items-center text-center">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mb-2">
                      {index + 1}
                    </div>
                    <span className="text-sm text-muted-foreground">{step}</span>
                  </div>
                ))}
              </div>
              <div className="h-1 bg-primary/20 relative mt-4">
                <div className="absolute left-0 top-0 h-full bg-primary" style={{ width: "100%" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

