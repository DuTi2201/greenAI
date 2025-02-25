"use client"

import { useEffect, useState } from "react"
import { useLanguage } from "@/providers/language-provider"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Lock, User, Mail, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { settingsService, ProfileData } from "@/lib/services/settings-service"

const translations = {
  en: {
    name: "Full Name",
    email: "Email",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmPassword: "Confirm Password",
    save: "Save Changes",
    saving: "Saving...",
    confirmTitle: "Confirm Changes",
    confirmDescription: "Are you sure you want to update your profile information?",
    confirmAction: "Yes, update profile",
    cancelAction: "Cancel",
    successTitle: "Profile Updated",
    successDescription: "Your profile has been updated successfully.",
    errorTitle: "Update Failed",
    errorDescription: "Failed to update profile. Please try again.",
    passwordError: "Current password is incorrect",
    errors: {
      required: "This field is required",
      email: "Please enter a valid email",
      passwordMin: "Password must be at least 8 characters",
      passwordMatch: "Passwords do not match",
    },
  },
  vi: {
    name: "Họ và Tên",
    email: "Email",
    currentPassword: "Mật khẩu Hiện tại",
    newPassword: "Mật khẩu Mới",
    confirmPassword: "Xác nhận Mật khẩu",
    save: "Lưu Thay đổi",
    saving: "Đang lưu...",
    confirmTitle: "Xác nhận Thay đổi",
    confirmDescription: "Bạn có chắc chắn muốn cập nhật thông tin hồ sơ không?",
    confirmAction: "Có, cập nhật hồ sơ",
    cancelAction: "Hủy",
    successTitle: "Hồ sơ Đã Cập nhật",
    successDescription: "Hồ sơ của bạn đã được cập nhật thành công.",
    errorTitle: "Cập nhật Thất bại",
    errorDescription: "Không thể cập nhật hồ sơ. Vui lòng thử lại.",
    passwordError: "Mật khẩu hiện tại không chính xác",
    errors: {
      required: "Vui lòng nhập thông tin",
      email: "Email không hợp lệ",
      passwordMin: "Mật khẩu phải có ít nhất 8 ký tự",
      passwordMatch: "Mật khẩu không khớp",
    },
  },
}

const formSchema = z
  .object({
    fullName: z.string().min(1, "Name is required"),
    email: z.string().email().optional(),
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

export function ProfileSettings() {
  const { language } = useLanguage()
  const t = translations[language]
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formValues, setFormValues] = useState<z.infer<typeof formSchema>>()
  const [profileData, setProfileData] = useState<ProfileData | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  // Lấy thông tin hồ sơ khi component được tải
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true)
        const data = await settingsService.getProfile()
        setProfileData(data)
        
        // Cập nhật giá trị mặc định cho form
        form.reset({
          fullName: data.fullName || "",
          email: data.email || "",
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      } catch (error) {
        console.warn("Error fetching profile:", error)
        toast({
          title: t.errorTitle,
          description: t.errorDescription,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [form, toast, t.errorDescription, t.errorTitle])

  // Xử lý khi submit form
  function onSubmit(values: z.infer<typeof formSchema>) {
    // Lưu giá trị form để sử dụng sau khi xác nhận
    setFormValues(values)
    // Mở dialog xác nhận
    setIsDialogOpen(true)
  }

  // Xử lý khi xác nhận cập nhật
  async function handleConfirmUpdate() {
    if (!formValues) return

    setIsLoading(true)
    try {
      // Chuẩn bị dữ liệu cập nhật
      const updateData = {
        fullName: formValues.fullName,
        ...(formValues.currentPassword && formValues.newPassword
          ? {
              currentPassword: formValues.currentPassword,
              newPassword: formValues.newPassword,
            }
          : {}),
      }

      // Gọi API cập nhật
      const updatedProfile = await settingsService.updateProfile(updateData)
      
      // Cập nhật state và reset form
      setProfileData(updatedProfile)
      form.reset({
        fullName: updatedProfile.fullName,
        email: updatedProfile.email,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })

      // Hiển thị thông báo thành công
      toast({
        title: t.successTitle,
        description: t.successDescription,
      })
    } catch (error: any) {
      console.warn("Error updating profile:", error)
      
      // Kiểm tra lỗi mật khẩu không chính xác
      if (error.response?.status === 400 && error.response?.data?.message === "Current password is incorrect") {
        toast({
          title: t.errorTitle,
          description: t.passwordError,
          variant: "destructive",
        })
        // Reset các trường mật khẩu
        form.setValue("currentPassword", "")
        form.setValue("newPassword", "")
        form.setValue("confirmPassword", "")
      } else {
        toast({
          title: t.errorTitle,
          description: t.errorDescription,
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
      setIsDialogOpen(false)
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.name}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-10" {...field} />
                  </div>
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
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="email" className="pl-10" {...field} disabled />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="pt-4 border-t">
            <h3 className="text-lg font-medium mb-4">Thay đổi mật khẩu</h3>
            
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.currentPassword}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input type="password" className="pl-10" {...field} />
                    </div>
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
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input type="password" className="pl-10" {...field} />
                    </div>
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
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input type="password" className="pl-10" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? t.saving : t.save}
          </Button>
        </form>
      </Form>

      {/* Dialog xác nhận cập nhật */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{t.confirmDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancelAction}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmUpdate} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t.confirmAction}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

