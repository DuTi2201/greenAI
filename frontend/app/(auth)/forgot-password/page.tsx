import { AuthForm } from "@/components/auth/auth-form"
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card"
import Link from "next/link"

export default function ForgotPasswordPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-full max-w-md border-none shadow-lg bg-background/95 backdrop-blur-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Quên mật khẩu</CardTitle>
          <CardDescription className="text-center">
            Nhập email của bạn để nhận liên kết đặt lại mật khẩu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-muted/50 rounded-lg text-sm">
            <p className="mb-2">Quy trình đặt lại mật khẩu:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Nhập email đã đăng ký của bạn</li>
              <li>Chúng tôi sẽ gửi một liên kết đặt lại mật khẩu đến email của bạn</li>
              <li>Nhấp vào liên kết trong email để đặt mật khẩu mới</li>
              <li>Đăng nhập với mật khẩu mới của bạn</li>
            </ol>
          </div>
          <AuthForm type="forgot-password" />
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <p className="text-sm text-muted-foreground">
            Nhớ mật khẩu? <Link href="/login" className="text-primary font-medium hover:underline">Đăng nhập</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

