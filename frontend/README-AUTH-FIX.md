# Hướng dẫn sửa vấn đề đăng nhập

File này chứa hướng dẫn để sửa vấn đề đăng nhập trong ứng dụng GardenAI.

## Vấn đề

Vấn đề hiện tại là sau khi đăng nhập thành công, người dùng bị chuyển hướng lại về trang đăng nhập ngay lập tức. Điều này có thể do một số nguyên nhân sau:

1. Token không được lưu đúng cách trong cookie
2. Token không được gửi trong header của các request
3. Token không đúng định dạng
4. Token bị từ chối bởi server
5. Vấn đề với CSRF token

## Giải pháp

Chúng tôi đã tạo các công cụ để giúp bạn sửa vấn đề này:

### 1. Trang sửa tự động

Truy cập trang `/auth-fix` để sửa vấn đề đăng nhập tự động. Trang này sẽ:
- Kiểm tra và khôi phục token nếu cần
- Lấy CSRF token mới
- Kiểm tra xem token có hợp lệ không
- Làm mới token nếu cần

### 2. Công cụ debug

Truy cập trang `/auth-debug` để debug vấn đề đăng nhập. Công cụ này cho phép bạn:
- Kiểm tra token trong cookie, localStorage và sessionStorage
- Kiểm tra CSRF token
- Xác thực token với server
- Kiểm tra quá trình làm mới token
- Kiểm tra các header trong request

### 3. Sửa thủ công

Nếu các công cụ trên không giúp bạn sửa vấn đề, bạn có thể thử các bước sau:

#### 3.1. Xóa cookie và đăng nhập lại

1. Mở DevTools (F12 hoặc Ctrl+Shift+I)
2. Chuyển đến tab Application > Storage > Cookies
3. Xóa tất cả các cookie của trang web
4. Đăng xuất và đăng nhập lại

#### 3.2. Sử dụng các hàm đã sửa

Trong code của bạn, sử dụng các hàm đã sửa từ `lib/auth-fix.ts`:

```typescript
import { setAuthTokenFixed, fetchCSRFTokenFixed, fixLoginIssue } from '@/lib/auth-fix';

// Thiết lập token
setAuthTokenFixed(token);

// Lấy CSRF token
await fetchCSRFTokenFixed();

// Sửa vấn đề đăng nhập
await fixLoginIssue();
```

#### 3.3. Kiểm tra cấu hình CORS

Đảm bảo server của bạn có cấu hình CORS đúng:

```javascript
// Server-side
app.use(cors({
  origin: 'http://localhost:3000', // Thay đổi thành domain của bạn
  credentials: true,
}));
```

#### 3.4. Kiểm tra cấu hình cookie

Đảm bảo cookie được thiết lập đúng cách:

```javascript
// Server-side
res.cookie('token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
});
```

## Kiểm tra

Sau khi sửa vấn đề, bạn có thể kiểm tra bằng cách:

1. Đăng nhập vào ứng dụng
2. Truy cập trang `/dashboard` hoặc bất kỳ trang nào yêu cầu xác thực
3. Làm mới trang để đảm bảo bạn không bị chuyển hướng lại về trang đăng nhập

## Các vấn đề thường gặp

### 1. Token không được lưu trong cookie

Kiểm tra trong DevTools > Application > Storage > Cookies để đảm bảo token được lưu.

### 2. Token không được gửi trong header

Kiểm tra trong DevTools > Network > Headers để đảm bảo token được gửi trong header Authorization.

### 3. CSRF token không đúng

Kiểm tra trong DevTools > Application > Storage > Cookies để đảm bảo CSRF token được lưu.

### 4. Server từ chối token

Kiểm tra logs của server để xem lý do token bị từ chối.

## Liên hệ

Nếu bạn vẫn gặp vấn đề, vui lòng liên hệ với chúng tôi qua email hoặc tạo issue trên GitHub. 