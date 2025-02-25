"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { fixLoginIssue } from "@/lib/auth-fix"

export default function AuthFixPage() {
  const [isFixing, setIsFixing] = useState(false)
  const [isFixed, setIsFixed] = useState<boolean | null>(null)
  const [message, setMessage] = useState("")
  const router = useRouter()

  const handleFix = async () => {
    setIsFixing(true)
    setMessage("Đang sửa vấn đề đăng nhập...")
    
    try {
      const result = await fixLoginIssue()
      setIsFixed(result)
      
      if (result) {
        setMessage("Đã sửa vấn đề đăng nhập thành công! Bạn sẽ được chuyển hướng đến trang Dashboard...")
        
        // Chuyển hướng đến trang Dashboard sau 3 giây
        setTimeout(() => {
          router.push("/dashboard")
        }, 3000)
      } else {
        setMessage("Không thể sửa vấn đề đăng nhập. Bạn cần đăng nhập lại.")
      }
    } catch (error) {
      setIsFixed(false)
      setMessage("Đã xảy ra lỗi khi sửa vấn đề đăng nhập. Vui lòng thử lại.")
      console.error("Lỗi:", error)
    } finally {
      setIsFixing(false)
    }
  }

  // Tự động sửa khi trang được tải
  useEffect(() => {
    handleFix()
  }, [])

  return (
    <div className="container mx-auto py-8 flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sửa vấn đề đăng nhập</CardTitle>
          <CardDescription>
            Công cụ này sẽ sửa các vấn đề phổ biến với đăng nhập và xác thực
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center py-8">
            {isFixing ? (
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
            ) : isFixed === true ? (
              <CheckCircle className="h-16 w-16 text-green-500" />
            ) : isFixed === false ? (
              <XCircle className="h-16 w-16 text-red-500" />
            ) : null}
          </div>
          
          <p className="text-center">{message}</p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => router.push("/login")}
            disabled={isFixing}
          >
            Đến trang đăng nhập
          </Button>
          
          <Button 
            onClick={handleFix} 
            disabled={isFixing}
          >
            {isFixing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang sửa...
              </>
            ) : (
              "Thử lại"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 