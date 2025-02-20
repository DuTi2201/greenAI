"use client"

import { RefreshCcw, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { MoonIcon, SunIcon } from "lucide-react"

export default function AdvisorHeader() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🌱</span>
        <h1 className="text-3xl font-bold">AI Garden Advisor</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" title="Refresh Data">
          <RefreshCcw className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" title="View History">
          <History className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title="Toggle Theme"
        >
          <SunIcon className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <MoonIcon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </div>
    </div>
  )
}

