import type React from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { FooterNav } from "@/components/layout/footer-nav"
import { LanguageProvider } from "@/providers/language-provider"
import { GardenProvider } from "@/contexts/garden-context"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <LanguageProvider>
      <GardenProvider>
        <div className="flex min-h-screen bg-background">
          <Sidebar />
          <div className="flex w-full flex-1 flex-col">
            <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
              <div className="flex min-h-screen flex-col">
                <div className="flex-1">{children}</div>
              </div>
            </main>
            <FooterNav />
          </div>
        </div>
      </GardenProvider>
    </LanguageProvider>
  )
}

