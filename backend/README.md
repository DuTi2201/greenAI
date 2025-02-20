# GreenAI Backend

Backend cho ứng dụng GreenAI - Hệ thống giám sát và chăm sóc cây trồng thông minh.

## Yêu cầu hệ thống

- Node.js (v14 trở lên)
- PostgreSQL (v12 trở lên)
- npm hoặc yarn

## Cài đặt

1. Clone repository:
```bash
git clone <repository-url>
cd backend
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Tạo file .env và cấu hình các biến môi trường:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=greenai
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your_jwt_secret_key
OPENAI_API_KEY=your_openai_api_key
```

4. Tạo database PostgreSQL:
```sql
CREATE DATABASE greenai;
```

## Chạy ứng dụng

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- POST /api/auth/register - Đăng ký tài khoản mới
- POST /api/auth/login - Đăng nhập

### Devices
- GET /api/devices - Lấy danh sách thiết bị
- GET /api/devices/:id - Lấy thông tin thiết bị
- POST /api/devices - Tạo thiết bị mới (Admin)
- PUT /api/devices/:id - Cập nhật thiết bị (Admin)
- DELETE /api/devices/:id - Xóa thiết bị (Admin)

### Sensors
- GET /api/sensors - Lấy dữ liệu cảm biến
- POST /api/sensors - Tạo dữ liệu cảm biến mới

### Alerts
- GET /api/alerts - Lấy danh sách cảnh báo
- POST /api/alerts - Tạo cảnh báo mới (Admin)
- PUT /api/alerts/:id/status - Cập nhật trạng thái cảnh báo (Admin)

## WebSocket Events

### Sensor Data
- Event: 'sensor_data' - Gửi dữ liệu cảm biến
- Event: 'sensor_update' - Nhận cập nhật dữ liệu cảm biến

### Device Control
- Event: 'device_control' - Gửi lệnh điều khiển thiết bị
- Event: 'device_update' - Nhận cập nhật trạng thái thiết bị 