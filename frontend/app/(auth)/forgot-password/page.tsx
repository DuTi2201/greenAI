import { AuthForm } from "@/components/auth/auth-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ForgotPasswordPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Forgot Password</CardTitle>
        </CardHeader>
        <CardContent>
          <AuthForm type="forgot-password" />
        </CardContent>
      </Card>
    </div>
  )
}

