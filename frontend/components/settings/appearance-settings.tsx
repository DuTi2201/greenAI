"use client"

import { useTheme } from "next-themes"
import { useLanguage } from "@/providers/language-provider"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Moon, Sun, Monitor } from "lucide-react"

const translations = {
  en: {
    theme: "Theme",
    themes: {
      light: "Light",
      dark: "Dark",
      system: "System",
    },
    language: "Language",
    languages: {
      en: "English",
      vi: "Vietnamese",
    },
  },
  vi: {
    theme: "Giao diện",
    themes: {
      light: "Sáng",
      dark: "Tối",
      system: "Hệ thống",
    },
    language: "Ngôn ngữ",
    languages: {
      en: "Tiếng Anh",
      vi: "Tiếng Việt",
    },
  },
}

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme()
  const { language, setLanguage } = useLanguage()
  const t = translations[language]

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>{t.theme}</Label>
        <div className="flex flex-wrap gap-4">
          <Button
            variant={theme === "light" ? "default" : "outline"}
            onClick={() => setTheme("light")}
            className="w-full sm:w-auto"
          >
            <Sun className="mr-2 h-4 w-4" />
            {t.themes.light}
          </Button>
          <Button
            variant={theme === "dark" ? "default" : "outline"}
            onClick={() => setTheme("dark")}
            className="w-full sm:w-auto"
          >
            <Moon className="mr-2 h-4 w-4" />
            {t.themes.dark}
          </Button>
          <Button
            variant={theme === "system" ? "default" : "outline"}
            onClick={() => setTheme("system")}
            className="w-full sm:w-auto"
          >
            <Monitor className="mr-2 h-4 w-4" />
            {t.themes.system}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t.language}</Label>
        <Select value={language} onValueChange={(value: "en" | "vi") => setLanguage(value)}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">{t.languages.en}</SelectItem>
            <SelectItem value="vi">{t.languages.vi}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

