import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Các route được bảo vệ (yêu cầu đăng nhập)
const protectedRoutes = [
  '/dashboard',
  '/settings',
  '/gardens',
  '/devices',
  '/analytics',
]

// Các route công khai (không yêu cầu đăng nhập)
const publicRoutes = [
  '/login',
  '/register',
  '/forgot-password',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Kiểm tra xem route hiện tại có phải là route được bảo vệ không
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  )
  
  // Kiểm tra xem route hiện tại có phải là route công khai không
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  )
  
  // Lấy token từ cookie
  const token = request.cookies.get('token')?.value
  
  // Nếu đang truy cập route được bảo vệ mà không có token
  if (isProtectedRoute && !token) {
    // Chuyển hướng đến trang đăng nhập với callback URL
    const url = new URL('/login', request.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }
  
  // Nếu đang truy cập route công khai mà đã có token
  if (isPublicRoute && token) {
    // Chuyển hướng đến trang dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  return NextResponse.next()
}

// Chỉ áp dụng middleware cho các route cần thiết
export const config = {
  matcher: [
    /*
     * Khớp với tất cả các đường dẫn ngoại trừ:
     * 1. /api (API routes)
     * 2. /_next/static (static files)
     * 3. /_next/image (image optimization files)
     * 4. /favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 