import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Lấy token từ cookie
  const token = request.cookies.get('token')?.value;
  
  // Đường dẫn hiện tại
  const { pathname } = request.nextUrl;
  
  // Danh sách các đường dẫn không cần xác thực
  const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
  
  // Kiểm tra xem đường dẫn hiện tại có nằm trong danh sách không cần xác thực không
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
  
  // Nếu không có token và đường dẫn cần xác thực
  if (!token && !isPublicPath) {
    // Tạo URL chuyển hướng đến trang đăng nhập
    const url = new URL('/login', request.url);
    // Thêm callbackUrl để sau khi đăng nhập có thể quay lại trang ban đầu
    url.searchParams.set('callbackUrl', pathname);
    
    // Chuyển hướng đến trang đăng nhập
    return NextResponse.redirect(url);
  }
  
  // Nếu có token và đang ở trang đăng nhập/đăng ký, chuyển hướng đến trang dashboard
  if (token && isPublicPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Cho phép request tiếp tục
  return NextResponse.next();
}

// Chỉ áp dụng middleware cho các đường dẫn sau
export const config = {
  matcher: [
    /*
     * Khớp với tất cả các đường dẫn ngoại trừ:
     * 1. /api (API routes)
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. /_vercel (Vercel internals)
     * 5. /favicon.ico, /sitemap.xml (static files)
     */
    '/((?!api|_next|_static|_vercel|favicon.ico|sitemap.xml).*)',
  ],
}; 