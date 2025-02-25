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
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { api } from "@/lib/api"
import { setAuthTokenFixed, fetchCSRFTokenFixed } from "@/lib/auth-fix"

const translations = {
  en: {
    name: "Full Name",
    email: "Email",
    phone: "Phone Number",
    password: "Password",
    confirmPassword: "Confirm Password",
    login: "Login",
    register: "Register",
    forgotPassword: "Forgot Password",
    submit: "Submit",
    loading: "Processing...",
    backToLogin: "Back to login",
    loginSuccess: "Login Successful",
    loginSuccessDesc: "You have successfully logged in",
    registerSuccess: "Registration Successful",
    registerSuccessDesc: "Your account has been created successfully",
    resetSuccess: "Password Reset Request Successful",
    resetSuccessDesc: "Please check your email to reset your password",
    errors: {
      invalidCredentials: "Invalid email or password",
      emailExists: "Email already exists in the system",
      emailNotFound: "Email not found in the system",
      serverError: "An error occurred, please try again later",
      required: "This field is required",
      email: "Please enter a valid email",
      phone: "Please enter a valid phone number",
      passwordMin: "Password must be at least 8 characters",
      passwordMatch: "Passwords do not match",
      passwordUppercase: "Password must contain at least 1 uppercase letter",
      passwordLowercase: "Password must contain at least 1 lowercase letter",
      passwordNumber: "Password must contain at least 1 number",
      passwordSpecial: "Password must contain at least 1 special character",
    },
  },
  vi: {
    name: "Họ và tên",
    email: "Email",
    phone: "Số điện thoại",
    password: "Mật khẩu",
    confirmPassword: "Xác nhận mật khẩu",
    login: "Đăng nhập",
    register: "Đăng ký",
    forgotPassword: "Quên mật khẩu",
    submit: "Gửi",
    loading: "Đang xử lý...",
    backToLogin: "Quay lại đăng nhập",
    loginSuccess: "Đăng nhập thành công",
    loginSuccessDesc: "Bạn đã đăng nhập thành công",
    registerSuccess: "Đăng ký thành công",
    registerSuccessDesc: "Tài khoản của bạn đã được tạo thành công",
    resetSuccess: "Yêu cầu đặt lại mật khẩu thành công",
    resetSuccessDesc: "Vui lòng kiểm tra email của bạn để nhận liên kết đặt lại mật khẩu",
    errors: {
      invalidCredentials: "Email hoặc mật khẩu không đúng",
      emailExists: "Email đã tồn tại trong hệ thống",
      emailNotFound: "Email không tồn tại trong hệ thống",
      serverError: "Đã xảy ra lỗi, vui lòng thử lại sau",
      required: "Vui lòng nhập thông tin",
      email: "Email không hợp lệ",
      phone: "Số điện thoại không hợp lệ",
      passwordMin: "Mật khẩu phải có ít nhất 8 ký tự",
      passwordMatch: "Mật khẩu không khớp",
      passwordUppercase: "Mật khẩu phải có ít nhất 1 chữ hoa",
      passwordLowercase: "Mật khẩu phải có ít nhất 1 chữ thường",
      passwordNumber: "Mật khẩu phải có ít nhất 1 số",
      passwordSpecial: "Mật khẩu phải có ít nhất 1 ký tự đặc biệt",
    },
  },
}

type AuthFormProps = {
  type: "login" | "register" | "forgot-password"
}

// Định nghĩa các kiểu dữ liệu cho form
type LoginFormValues = {
  email: string
  password: string
}

type RegisterFormValues = {
  name: string
  email: string
  password: string
  confirmPassword: string
  phone: string
}

type ForgotPasswordFormValues = {
  email: string
}

export function AuthForm({ type }: AuthFormProps) {
  const { language } = useLanguage()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const t = translations[language]

  // Lấy CSRF token khi component được mount
  React.useEffect(() => {
    const getCSRFToken = async () => {
      await fetchCSRFTokenFixed();
    };
    
    getCSRFToken();
  }, []);

  // Form schemas for different auth types
  const loginSchema = z.object({
    email: z.string().email(t.errors.email),
    password: z.string().min(8, t.errors.passwordMin),
  })

  const registerSchema = z
    .object({
      name: z.string().min(1, t.errors.required),
      email: z.string().email(t.errors.email),
      password: z.string()
        .min(8, t.errors.passwordMin)
        .regex(/[A-Z]/, t.errors.passwordUppercase)
        .regex(/[a-z]/, t.errors.passwordLowercase)
        .regex(/[0-9]/, t.errors.passwordNumber)
        .regex(/[^A-Za-z0-9]/, t.errors.passwordSpecial),
      confirmPassword: z.string(),
      phone: z.string().min(1, t.errors.required),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t.errors.passwordMatch,
      path: ["confirmPassword"],
    })

  const forgotPasswordSchema = z.object({
    email: z.string().email(t.errors.email),
  })

  // Select schema based on form type
  const formSchema = type === "login" 
    ? loginSchema 
    : type === "register" 
      ? registerSchema 
      : forgotPasswordSchema

  // Sử dụng kiểu dữ liệu phù hợp với loại form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setError('');

    try {
      // Đảm bảo có CSRF token trước khi gửi request
      await fetchCSRFTokenFixed();
      
      if (type === 'login') {
        const loginValues = values as LoginFormValues;
        const response = await api.post('/auth/login', {
          email: loginValues.email,
          password: loginValues.password,
        });
        
        // Sử dụng hàm setAuthTokenFixed thay vì setAuthToken
        setAuthTokenFixed(response.data.data.token);
        
        toast({
          title: t.loginSuccess,
          description: t.loginSuccessDesc,
        });
        
        // Kiểm tra xem có đường dẫn redirect được lưu trong sessionStorage không
        let redirectPath = callbackUrl;
        if (typeof window !== 'undefined') {
          const savedRedirect = sessionStorage.getItem('redirectAfterLogin');
          if (savedRedirect) {
            redirectPath = savedRedirect;
            sessionStorage.removeItem('redirectAfterLogin');
          }
        }
        
        // Chuyển hướng đến redirectPath hoặc callbackUrl
        router.push(redirectPath);
      } else if (type === 'register') {
        // Gọi API đăng ký với kiểu RegisterFormValues
        const registerValues = values as RegisterFormValues
        const registerData = {
          email: registerValues.email,
          password: registerValues.password,
          fullName: registerValues.name,
          preferredLanguage: language, // Sử dụng ngôn ngữ hiện tại
          themePreference: 'light', // Mặc định là light theme
          phoneNumber: registerValues.phone,
        };
        
        console.log('Dữ liệu đăng ký:', registerData);
        
        await api.post("/auth/register", registerData)
        
        toast({
          title: t.registerSuccess,
          description: t.registerSuccessDesc,
        })
        
        // Chuyển hướng đến trang đăng nhập
        router.push("/login")
      } else if (type === 'forgot-password') {
        // Gọi API quên mật khẩu với kiểu ForgotPasswordFormValues
        const forgotValues = values as ForgotPasswordFormValues
        await api.post("/auth/forgot-password", {
          email: forgotValues.email,
        })
        
        toast({
          title: t.resetSuccess,
          description: t.resetSuccessDesc,
          variant: "success",
          duration: 5000,
        })
      }
    } catch (error: any) {
      console.warn("Auth error:", error)
      console.warn("Chi tiết lỗi:", error.response?.data)
      
      // Xử lý lỗi CSRF
      if (error.response?.status === 403 && error.response?.data?.message?.includes('csrf')) {
        toast({
          title: "Lỗi bảo mật",
          description: "Vui lòng tải lại trang và thử lại",
          variant: "destructive",
        });
      } else {
        // Xử lý các lỗi khác như cũ
        const errorMessage = error.response?.data?.message || (
          type === "login" 
            ? t.errors.invalidCredentials 
            : type === "register" 
              ? t.errors.emailExists 
              : t.errors.emailNotFound
        );
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {type === "register" && (
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
        )}

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

        {type === "register" && (
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
        )}

        {(type === "login" || type === "register") && (
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.password}</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {type === "register" && (
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
        )}

        <div className="space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? t.loading : type === "login" ? t.login : type === "register" ? t.register : t.submit}
          </Button>

          {type === "login" && (
            <Button variant="link" className="w-full" asChild>
              <Link href="/forgot-password">{t.forgotPassword}</Link>
            </Button>
          )}

          {(type === "register" || type === "forgot-password") && (
            <Button variant="link" className="w-full" asChild>
              
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
}

