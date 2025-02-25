"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useLanguage } from "@/providers/language-provider"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

const translations = {
  en: {
    title: "Profile Settings",
    name: "Full Name",
    email: "Email",
    phone: "Phone Number",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmPassword: "Confirm New Password",
    save: "Save Changes",
    saving: "Saving...",
    errors: {
      required: "This field is required",
      email: "Please enter a valid email",
      phone: "Please enter a valid phone number",
      passwordMin: "Password must be at least 8 characters",
      passwordMatch: "Passwords do not match",
    },
  },
  vi: {
    title: "Cài đặt Hồ sơ",
    name: "Họ và Tên",
    email: "Email",
    phone: "Số điện thoại",
    currentPassword: "Mật khẩu Hiện tại",
    newPassword: "Mật khẩu Mới",
    confirmPassword: "Xác nhận Mật khẩu Mới",
    save: "Lưu Thay đổi",
    saving: "Đang lưu...",
    errors: {
      required: "Vui lòng nhập thông tin",
      email: "Email không hợp lệ",
      phone: "Số điện thoại không hợp lệ",
      passwordMin: "Mật khẩu phải có ít nhất 8 ký tự",
      passwordMatch: "Mật khẩu không khớp",
    },
  },
}

const formSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email(),
    phone: z.string().min(1, "Phone number is required"),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8).optional(),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.newPassword && !data.currentPassword) {
        return false
      }
      if (data.newPassword && data.newPassword !== data.confirmPassword) {
        return false
      }
      return true
    },
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    },
  )

export function ProfileForm() {
  const { language } = useLanguage()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState(false)
  const t = translations[language]

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
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
        description: "Profile updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.name}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.email}</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.phone}</FormLabel>
              <FormControl>
                <Input type="tel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.currentPassword}</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.newPassword}</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.confirmPassword}</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? t.saving : t.save}
        </Button>
      </form>
    </Form>
  )
}

