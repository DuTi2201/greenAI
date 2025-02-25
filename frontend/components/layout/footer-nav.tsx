"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useLanguage } from "@/providers/language-provider"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Sliders, FileText, Settings, Smartphone } from "lucide-react"

const translations = {
  en: {
    dashboard: "Dashboard",
    automation: "Automation",
    reports: "Reports",
    devices: "Devices",
    settings: "Settings",
  },
  vi: {
    dashboard: "Bảng điều khiển",
    automation: "Tự động hóa",
    reports: "Báo cáo",
    devices: "Thiết bị",
    settings: "Cài đặt",
  },
}

export function FooterNav() {
  const pathname = usePathname()
  const { language } = useLanguage()
  const t = translations[language]

  const routes = [
    {
      href: "/dashboard",
      icon: LayoutDashboard,
      label: t.dashboard,
    },
    {
      href: "/automation",
      icon: Sliders,
      label: t.automation,
    },
    {
      href: "/reports",
      icon: FileText,
      label: t.reports,
    },
    {
      href: "/devices",
      icon: Smartphone,
      label: t.devices,
    },
    {
      href: "/settings",
      icon: Settings,
      label: t.settings,
    },
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background">
      <nav className="flex justify-around">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex flex-col items-center py-2 px-4",
              pathname === route.href ? "text-primary" : "text-muted-foreground hover:text-primary",
            )}
          >
            <route.icon className="h-5 w-5" />
            <span className="text-xs mt-1">{route.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}

