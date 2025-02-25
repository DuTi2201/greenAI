import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import Link from "next/link"

export default function ResetPasswordPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-full max-w-md border-none shadow-lg bg-background/95 backdrop-blur-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Đặt lại mật khẩu</CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            Nhập mật khẩu mới của bạn
          </p>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm />
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