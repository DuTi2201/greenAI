"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useLanguage } from "@/providers/language-provider"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Menu, LayoutDashboard, Sliders, FileText, Settings, Smartphone, LogOut } from "lucide-react"

const translations = {
  en: {
    dashboard: "Dashboard",
    automation: "Automation",
    reports: "Reports",
    devices: "Devices",
    settings: "Settings",
    logout: "Logout",
  },
  vi: {
    dashboard: "Bảng điều khiển",
    automation: "Tự động hóa",
    reports: "Báo cáo",
    devices: "Thiết bị",
    settings: "Cài đặt",
    logout: "Đăng xuất",
  },
}

export function Sidebar() {
  const pathname = usePathname()
  const { language } = useLanguage()
  const { logout } = useAuth()
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

  const nav = (
    <>
      <div className="flex h-14 items-center border-b px-4">
        <span className="font-semibold">Smart Garden</span>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex-1 space-y-1 p-2">
          <nav className="grid gap-1">
            {routes.map((route) => (
              <Button
                key={route.href}
                variant={pathname === route.href ? "secondary" : "ghost"}
                className={cn("w-full justify-start", pathname === route.href && "bg-muted")}
                asChild
              >
                <Link href={route.href}>
                  <route.icon className="mr-2 h-4 w-4" />
                  {route.label}
                </Link>
              </Button>
            ))}
          </nav>
        </div>
      </ScrollArea>
      <div className="border-t p-4">
        <Button 
          variant="ghost" 
          className="w-full justify-start"
          onClick={async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Lỗi khi đăng xuất:', error);
            }
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {t.logout}
        </Button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Navigation */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          {nav}
        </SheetContent>
      </Sheet>

      {/* Desktop Navigation */}
      <div className="hidden border-r bg-background md:flex md:w-72 md:flex-col">{nav}</div>
    </>
  )
}

