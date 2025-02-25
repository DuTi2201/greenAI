#!/bin/bash

# Cài đặt các dependencies cần thiết
echo "Cài đặt các dependencies cần thiết..."
npm install --save-dev axios-mock-adapter babel-jest

# Chạy các bài kiểm tra xác thực
echo "Chạy các bài kiểm tra xác thực..."
npm test -- -t "Kiểm tra chức năng xác thực" --verbose

# Chạy các bài kiểm tra API interceptors
echo "Chạy các bài kiểm tra API interceptors..."
npm test -- -t "API Interceptors" --verbose

# Chạy các bài kiểm tra TokenChecker
echo "Chạy các bài kiểm tra TokenChecker..."
npm test -- -t "TokenChecker" --verbose

echo "Hoàn thành!" 