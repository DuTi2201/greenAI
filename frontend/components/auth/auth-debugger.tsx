"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2 } from "lucide-react"
import { 
  checkTokenInCookie, 
  checkTokenInLocalStorage, 
  checkTokenInSessionStorage,
  checkCSRFToken,
  validateTokenWithServer,
  testRefreshToken,
  checkRequestHeaders,
  debugAuthentication
} from "@/lib/auth-debug"

export function AuthDebugger() {
  const [logs, setLogs] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("token")

  // Ghi đè console.log để lưu logs
  const originalConsoleLog = console.log
  console.log = (...args) => {
    originalConsoleLog(...args)
    setLogs(prev => [...prev, args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ')])
  }

  const clearLogs = () => {
    setLogs([])
  }

  const runTest = async (testFn: () => Promise<boolean | void> | boolean | void, name: string) => {
    clearLogs()
    setIsLoading(true)
    setLogs([`Đang chạy kiểm tra: ${name}...`])
    
    try {
      await testFn()
    } catch (error) {
      console.log(`Lỗi khi chạy kiểm tra ${name}:`, error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Công cụ Debug Xác thực</CardTitle>
        <CardDescription>
          Kiểm tra và debug các vấn đề liên quan đến xác thực, token và cookie
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="token">Token</TabsTrigger>
            <TabsTrigger value="csrf">CSRF</TabsTrigger>
            <TabsTrigger value="validate">Xác thực</TabsTrigger>
            <TabsTrigger value="refresh">Làm mới</TabsTrigger>
            <TabsTrigger value="all">Tất cả</TabsTrigger>
          </TabsList>
          
          <TabsContent value="token" className="space-y-4">
            <div className="flex space-x-2">
              <Button 
                onClick={() => runTest(checkTokenInCookie, "Token trong Cookie")}
                disabled={isLoading}
              >
                Kiểm tra Cookie
              </Button>
              <Button 
                onClick={() => runTest(checkTokenInLocalStorage, "Token trong LocalStorage")}
                disabled={isLoading}
              >
                Kiểm tra LocalStorage
              </Button>
              <Button 
                onClick={() => runTest(checkTokenInSessionStorage, "Token trong SessionStorage")}
                disabled={isLoading}
              >
                Kiểm tra SessionStorage
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="csrf">
            <Button 
              onClick={() => runTest(checkCSRFToken, "CSRF Token")}
              disabled={isLoading}
            >
              Kiểm tra CSRF Token
            </Button>
          </TabsContent>
          
          <TabsContent value="validate">
            <Button 
              onClick={() => runTest(validateTokenWithServer, "Xác thực Token")}
              disabled={isLoading}
            >
              Xác thực Token với Server
            </Button>
          </TabsContent>
          
          <TabsContent value="refresh">
            <div className="flex space-x-2">
              <Button 
                onClick={() => runTest(testRefreshToken, "Làm mới Token")}
                disabled={isLoading}
              >
                Kiểm tra Làm mới Token
              </Button>
              <Button 
                onClick={() => runTest(checkRequestHeaders, "Headers Request")}
                disabled={isLoading}
              >
                Kiểm tra Headers
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="all">
            <Button 
              onClick={() => runTest(debugAuthentication, "Toàn bộ quá trình xác thực")}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang kiểm tra...
                </>
              ) : (
                "Kiểm tra Toàn bộ"
              )}
            </Button>
          </TabsContent>
        </Tabs>
        
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium">Kết quả</h3>
            <Button variant="outline" size="sm" onClick={clearLogs}>
              Xóa logs
            </Button>
          </div>
          <ScrollArea className="h-[300px] border rounded-md p-4 bg-muted/20">
            <pre className="text-sm whitespace-pre-wrap">
              {logs.length > 0 ? logs.join('\n') : 'Chưa có kết quả. Hãy chạy một kiểm tra.'}
            </pre>
          </ScrollArea>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          Sử dụng công cụ này để debug các vấn đề xác thực
        </p>
      </CardFooter>
    </Card>
  )
} 