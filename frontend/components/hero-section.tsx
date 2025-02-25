"use client"

import { useLanguage } from "@/providers/language-provider"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

export function HeroSection() {
  const { language } = useLanguage()

  const content = {
    en: {
      title: "Smart Garden Management - Remote Monitoring & Control",
      description:
        "Integrate IoT and AI technologies to optimize garden care, monitor real-time data, and automate your garden management processes.",
      login: "Login",
      register: "Register",
    },
    vi: {
      title: "Quản lý Vườn Thông Minh - Giám sát & Điều khiển từ xa",
      description:
        "Tích hợp công nghệ IoT và AI để tối ưu hóa việc chăm sóc vườn, giám sát dữ liệu thời gian thực và tự động hóa quy trình quản lý vườn của bạn.",
      login: "Đăng nhập",
      register: "Đăng ký",
    },
  }

  const t = content[language]

  return (
    <div className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Background Video/Image */}
      <div className="absolute inset-0 z-0">
      <Image
  src="/images/background_image.jpg"
  alt="Background Image"
  fill
  className="object-cover"
/>

        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center text-white">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">{t.title}</h1>
        <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">{t.description}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
            <Link href="/login">{t.login}</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 border-white">
            <Link href="/register">{t.register}</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

