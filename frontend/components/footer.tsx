"use client"

import { useLanguage } from "@/providers/language-provider"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Facebook, Twitter, Instagram, Mail, Phone } from "lucide-react"

export function Footer() {
  const { language, setLanguage } = useLanguage()

  const content = {
    en: {
      contact: "Contact",
      quickLinks: "Quick Links",
      language: "Language",
      about: "About",
      support: "Support",
      terms: "Terms of Use",
      privacy: "Privacy Policy",
    },
    vi: {
      contact: "Liên hệ",
      quickLinks: "Liên kết nhanh",
      language: "Ngôn ngữ",
      about: "Giới thiệu",
      support: "Hỗ trợ",
      terms: "Điều khoản sử dụng",
      privacy: "Chính sách bảo mật",
    },
  }

  const t = content[language]

  return (
    <footer className="bg-background border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t.contact}</h3>
            <div className="space-y-2">
              <a
                href="mailto:support@smartgarden.com"
                className="flex items-center gap-2 text-muted-foreground hover:text-primary"
              >
                <Mail className="w-4 h-4" />
                support@smartgarden.com
              </a>
              <a href="tel:+1234567890" className="flex items-center gap-2 text-muted-foreground hover:text-primary">
                <Phone className="w-4 h-4" />
                +123 456 7890
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t.quickLinks}</h3>
            <div className="space-y-2">
              <Button variant="link" className="p-0 h-auto">
                {t.about}
              </Button>
              <Button variant="link" className="p-0 h-auto">
                {t.support}
              </Button>
              <Button variant="link" className="p-0 h-auto">
                {t.terms}
              </Button>
              <Button variant="link" className="p-0 h-auto">
                {t.privacy}
              </Button>
            </div>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Social Media</h3>
            <div className="flex gap-4">
              <Button size="icon" variant="ghost">
                <Facebook className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost">
                <Twitter className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost">
                <Instagram className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Language Selector */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t.language}</h3>
            <Select value={language} onValueChange={(value: "en" | "vi") => setLanguage(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="vi">Tiếng Việt</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </footer>
  )
}

