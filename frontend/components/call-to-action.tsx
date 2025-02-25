"use client"

import { useLanguage } from "@/providers/language-provider"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function CallToAction() {
  const { language } = useLanguage()

  const content = {
    en: {
      title: "Start Your Smart Garden Journey Today",
      description: "Experience the future of garden management with our IoT-powered solution",
      cta: "Get Started",
      demo: "Watch Demo",
    },
    vi: {
      title: "Bắt đầu Hành trình Vườn Thông minh Ngay hôm nay",
      description: "Trải nghiệm tương lai của quản lý vườn với giải pháp IoT của chúng tôi",
      cta: "Bắt đầu ngay",
      demo: "Xem Demo",
    },
  }

  const t = content[language]

  return (
    <section className="py-20 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">{t.title}</h2>
        <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto opacity-90">{t.description}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
            <Link href="/register">{t.cta}</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
            <Link href="/demo">{t.demo}</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

