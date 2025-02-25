"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useLanguage } from "@/providers/language-provider"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

const translations = {
  en: {
    title: "Connect New Device",
    serial: "WEMOS Serial Number",
    serialDesc: "Enter the serial number found on your device",
    apiKey: "API Key",
    apiKeyDesc: "Enter the API key provided with your device",
    connect: "Connect Device",
    connecting: "Connecting...",
  },
  vi: {
    title: "Kết nối Thiết bị Mới",
    serial: "Số Serial WEMOS",
    serialDesc: "Nhập số serial được tìm thấy trên thiết bị của bạn",
    apiKey: "Khóa API",
    apiKeyDesc: "Nhập khóa API được cung cấp cùng thiết bị",
    connect: "Kết nối Thiết bị",
    connecting: "Đang kết nối...",
  },
}

const formSchema = z.object({
  serial: z.string().min(1, "Serial number is required"),
  apiKey: z.string().min(1, "API key is required"),
})

export function DeviceConnectionForm() {
  const { language } = useLanguage()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState(false)
  const t = translations[language]

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serial: "",
      apiKey: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))
      console.log(values)
      toast({
        title: "Success",
        description: "Device connected successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect device",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="serial"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.serial}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>{t.serialDesc}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="apiKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.apiKey}</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormDescription>{t.apiKeyDesc}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? t.connecting : t.connect}
        </Button>
      </form>
    </Form>
  )
}

