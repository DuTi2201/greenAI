"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { api } from "@/lib/api"
import { useLanguage } from "@/providers/language-provider"
import { fetchCSRFTokenFixed } from "@/lib/auth-fix"

const translations = {
  en: {
    resetPassword: "Reset Password",
    newPassword: "New Password",
    confirmPassword: "Confirm Password",
    submit: "Reset Password",
    loading: "Processing...",
    resetSuccess: "Password Reset Successful",
    resetSuccessDesc: "Your password has been reset successfully. You can now login with your new password.",
    resetError: "Password Reset Failed",
    resetErrorDesc: "There was an error resetting your password. Please try again.",
    invalidToken: "Invalid or Expired Token",
    invalidTokenDesc: "The password reset link is invalid or has expired. Please request a new one.",
    passwordRequirements: "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
    passwordMatch: "Passwords do not match",
  },
  vi: {
    resetPassword: "Đặt lại mật khẩu",
    newPassword: "Mật khẩu mới",
    confirmPassword: "Xác nhận mật khẩu",
    submit: "Đặt lại mật khẩu",
    loading: "Đang xử lý...",
    resetSuccess: "Đặt lại mật khẩu thành công",
    resetSuccessDesc: "Mật khẩu của bạn đã được đặt lại thành công. Bạn có thể đăng nhập với mật khẩu mới.",
    resetError: "Đặt lại mật khẩu thất bại",
    resetErrorDesc: "Đã xảy ra lỗi khi đặt lại mật khẩu. Vui lòng thử lại.",
    invalidToken: "Token không hợp lệ hoặc đã hết hạn",
    invalidTokenDesc: "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu liên kết mới.",
    passwordRequirements: "Mật khẩu phải có ít nhất 8 ký tự và bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.",
    passwordMatch: "Mật khẩu không khớp",
  },
}

const resetPasswordSchema = z.object({
  newPassword: z.string()
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
    .regex(/[A-Z]/, "Mật khẩu phải có ít nhất 1 chữ hoa")
    .regex(/[a-z]/, "Mật khẩu phải có ít nhất 1 chữ thường")
    .regex(/[0-9]/, "Mật khẩu phải có ít nhất 1 số")
    .regex(/[^A-Za-z0-9]/, "Mật khẩu phải có ít nhất 1 ký tự đặc biệt"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Mật khẩu không khớp",
  path: ["confirmPassword"],
})

export function ResetPasswordForm() {
  const { language } = useLanguage()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [isLoading, setIsLoading] = useState(false)
  const [tokenValid, setTokenValid] = useState(true)
  const t = translations[language]

  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  })

  useEffect(() => {
    // Kiểm tra xem có token trong URL không
    if (!token) {
      setTokenValid(false)
      toast({
        variant: "destructive",
        title: t.invalidToken,
        description: t.invalidTokenDesc,
      })
    }
  }, [token, toast, t])

  const onSubmit = async (values: z.infer<typeof resetPasswordSchema>) => {
    if (!token) {
      setTokenValid(false)
      return
    }

    setIsLoading(true)

    try {
      // Đảm bảo có CSRF token trước khi gửi request
      await fetchCSRFTokenFixed()

      // Gọi API đặt lại mật khẩu
      await api.post("/auth/reset-password", {
        token,
        newPassword: values.newPassword,
      })

      toast({
        title: t.resetSuccess,
        description: t.resetSuccessDesc,
      })

      // Chuyển hướng đến trang đăng nhập sau 2 giây
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (error: any) {
      console.error("Reset password error:", error)

      // Kiểm tra lỗi token không hợp lệ
      if (error.response?.status === 400) {
        setTokenValid(false)
        toast({
          variant: "destructive",
          title: t.invalidToken,
          description: t.invalidTokenDesc,
        })
      } else {
        toast({
          variant: "destructive",
          title: t.resetError,
          description: error.response?.data?.message || t.resetErrorDesc,
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!tokenValid) {
    return (
      <div className="text-center">
        <h2 className="text-lg font-semibold text-destructive mb-2">{t.invalidToken}</h2>
        <p className="text-sm text-muted-foreground mb-4">{t.invalidTokenDesc}</p>
        <Button onClick={() => router.push("/forgot-password")}>
          Yêu cầu liên kết mới
        </Button>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.newPassword}</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                {t.passwordRequirements}
              </p>
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
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? t.loading : t.submit}
        </Button>
      </form>
    </Form>
  )
} 