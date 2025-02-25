#!/bin/bash

# Script để sửa các vấn đề đăng nhập

echo "=== Bắt đầu sửa các vấn đề đăng nhập ==="

# Kiểm tra xem đã đăng nhập chưa
echo "Kiểm tra trạng thái đăng nhập..."
TOKEN=$(grep -o '"token":"[^"]*' ~/.config/gardenai/auth.json 2>/dev/null | sed 's/"token":"//')

if [ -z "$TOKEN" ]; then
  echo "Bạn chưa đăng nhập. Vui lòng đăng nhập trước khi chạy script này."
  exit 1
fi

# Xóa cookie cũ
echo "Xóa cookie cũ..."
if [ -d ~/.config/gardenai/cookies ]; then
  rm -rf ~/.config/gardenai/cookies
  mkdir -p ~/.config/gardenai/cookies
fi

# Khởi động lại ứng dụng
echo "Khởi động lại ứng dụng..."
if pgrep -f "npm run dev" > /dev/null; then
  pkill -f "npm run dev"
  sleep 2
  npm run dev &
  echo "Đã khởi động lại ứng dụng."
else
  npm run dev &
  echo "Đã khởi động ứng dụng."
fi

# Đợi ứng dụng khởi động
echo "Đợi ứng dụng khởi động..."
sleep 5

# Mở trang sửa lỗi đăng nhập
echo "Mở trang sửa lỗi đăng nhập..."
if command -v open >/dev/null 2>&1; then
  # macOS
  open http://localhost:3000/auth-fix
elif command -v xdg-open >/dev/null 2>&1; then
  # Linux
  xdg-open http://localhost:3000/auth-fix
elif command -v start >/dev/null 2>&1; then
  # Windows
  start http://localhost:3000/auth-fix
else
  echo "Không thể mở trình duyệt tự động. Vui lòng mở URL sau trong trình duyệt của bạn:"
  echo "http://localhost:3000/auth-fix"
fi

echo "=== Hoàn thành các bước sửa lỗi đăng nhập ==="
echo "Nếu vẫn gặp vấn đề, vui lòng truy cập http://localhost:3000/auth-debug để debug thêm." 