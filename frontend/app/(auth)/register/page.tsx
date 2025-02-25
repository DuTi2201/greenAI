import { AuthForm } from "@/components/auth/auth-form"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import Link from "next/link"

export default function RegisterPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Register</CardTitle>
        </CardHeader>
        <CardContent>
          <AuthForm type="register" />
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <p className="text-sm text-muted-foreground">
            Đã có tài khoản? <Link href="/login" className="text-primary font-medium hover:underline">Đăng nhập</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

