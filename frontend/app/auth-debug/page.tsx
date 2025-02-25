"use client"

import { AuthDebugger } from "@/components/auth/auth-debugger"

export default function AuthDebugPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Công cụ Debug Xác thực</h1>
      <AuthDebugger />
    </div>
  )
} 