"use client"

import { RuleList } from "@/components/automation/rule-list"
import { useLanguage } from "@/providers/language-provider"

const translations = {
  en: {
    title: "Automation",
    description: "Create and manage rules to automate your garden",
  },
  vi: {
    title: "Tự động hóa",
    description: "Tạo và quản lý quy tắc để tự động hóa vườn của bạn",
  },
}

export default function AutomationPage() {
  const { language } = useLanguage()
  const t = translations[language]

  return (
    <div className="container py-6 space-y-6">
     
      <RuleList />
    </div>
  )
} 