"use client"

import { useState } from "react"

import { useLanguage } from "@/providers/language-provider"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"

const translations = {
  en: {
    frequency: "Report Frequency",
    format: "Report Format",
    email: "Email Notifications",
    recipients: "Recipients",
    save: "Save Schedule",
    saving: "Saving...",
    frequencies: {
      daily: "Daily",
      weekly: "Weekly",
      monthly: "Monthly",
    },
    formats: {
      pdf: "PDF",
      excel: "Excel",
      both: "Both PDF & Excel",
    },
    descriptions: {
      email: "Send reports to specified email addresses",
      recipients: "Separate multiple email addresses with commas",
    },
  },
  vi: {
    frequency: "Tần suất Báo cáo",
    format: "Định dạng Báo cáo",
    email: "Thông báo qua Email",
    recipients: "Người nhận",
    save: "Lưu Lịch",
    saving: "Đang lưu...",
    frequencies: {
      daily: "Hàng ngày",
      weekly: "Hàng tuần",
      monthly: "Hàng tháng",
    },
    formats: {
      pdf: "PDF",
      excel: "Excel",
      both: "Cả PDF & Excel",
    },
    descriptions: {
      email: "Gửi báo cáo đến các địa chỉ email được chỉ định",
      recipients: "Phân tách nhiều địa chỉ email bằng dấu phẩy",
    },
  },
}

const formSchema = z.object({
  frequency: z.string(),
  format: z.string(),
  emailEnabled: z.boolean(),
  recipients: z.string().email().optional(),
})

export function ReportScheduler() {
  const { language } = useLanguage()
  const t = translations[language]

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      frequency: "weekly",
      format: "pdf",
      emailEnabled: false,
    },
  })

  const [isLoading, setIsLoading] = useState(false)

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))
      console.log(values)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="frequency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.frequency}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="daily">{t.frequencies.daily}</SelectItem>
                  <SelectItem value="weekly">{t.frequencies.weekly}</SelectItem>
                  <SelectItem value="monthly">{t.frequencies.monthly}</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="format"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.format}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="pdf">{t.formats.pdf}</SelectItem>
                  <SelectItem value="excel">{t.formats.excel}</SelectItem>
                  <SelectItem value="both">{t.formats.both}</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="emailEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>{t.email}</FormLabel>
                <FormDescription>{t.descriptions.email}</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        {form.watch("emailEnabled") && (
          <FormField
            control={form.control}
            name="recipients"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.recipients}</FormLabel>
                <FormControl>
                  <Input {...field} type="email" multiple />
                </FormControl>
                <FormDescription>{t.descriptions.recipients}</FormDescription>
              </FormItem>
            )}
          />
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? t.saving : t.save}
        </Button>
      </form>
    </Form>
  )
}

