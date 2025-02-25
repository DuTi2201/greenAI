/*
 * GardenAI - Wemos D1 Firmware
 * Kết nối thiết bị Wemos D1 với hệ thống GardenAI
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoJson.h>
#include <EEPROM.h>
#include <SoftwareSerial.h>

// Cấu hình thiết bị - THAY ĐỔI CÁC GIÁ TRỊ NÀY
const char* WIFI_SSID = "TenWiFi";           // Tên WiFi
const char* WIFI_PASSWORD = "MatKhauWiFi";   // Mật khẩu WiFi
const char* WEMOS_SERIAL = "YOUR6C";         // 6 ký tự
const char* API_KEY = "YOUR5";               // 5 ký tự
const char* FIRMWARE_VERSION = "1.0.0";      // Phiên bản firmware

// Cấu hình API - Thay đổi domain.com thành địa chỉ máy chủ của bạn
const char* API_HOST = "domain.com";
const char* AUTH_URL = "http://domain.com/api/auth/device";
const char* SENSOR_URL = "http://domain.com/api/sensors";
const char* HEARTBEAT_URL = "http://domain.com/api/devices/heartbeat";
const char* CONTROL_URL = "http://domain.com/api/devices/control";

// Cấu hình chân kết nối
#define ARDUINO_RX 4  // D2 trên Wemos D1
#define ARDUINO_TX 5  // D1 trên Wemos D1

// Biến toàn cục
String authToken = "";
String deviceId = "";
unsigned long lastSensorUpdate = 0;
unsigned long lastHeartbeat = 0;
unsigned long lastControlCheck = 0;
bool ledStatus = false;
bool fanStatus = false;
bool waterPumpStatus = false;
bool nutrientPumpStatus = false;

// Khởi tạo kết nối Serial với Arduino
SoftwareSerial arduinoSerial(ARDUINO_RX, ARDUINO_TX);

void setup() {
  // Khởi tạo Serial để debug
  Serial.begin(115200);
  Serial.println("\nKhởi động GardenAI Wemos D1...");
  
  // Khởi tạo Serial để giao tiếp với Arduino
  arduinoSerial.begin(9600);
  
  // Kết nối WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Đang kết nối WiFi");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("");
  Serial.print("Đã kết nối WiFi, địa chỉ IP: ");
  Serial.println(WiFi.localIP());
  
  // Xác thực thiết bị
  authenticateDevice();
}

void loop() {
  // Kiểm tra kết nối WiFi
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Mất kết nối WiFi, đang kết nối lại...");
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    delay(5000);
    return;
  }
  
  // Đọc dữ liệu từ Arduino
  if (millis() - lastSensorUpdate > 60000) { // Cập nhật mỗi 1 phút
    readSensorData();
    lastSensorUpdate = millis();
  }
  
  // Gửi heartbeat
  if (millis() - lastHeartbeat > 300000) { // Heartbeat mỗi 5 phút
    sendHeartbeat();
    lastHeartbeat = millis();
  }
  
  // Kiểm tra trạng thái điều khiển
  if (millis() - lastControlCheck > 10000) { // Kiểm tra mỗi 10 giây
    checkControlStatus();
    lastControlCheck = millis();
  }
  
  // Xử lý các lệnh từ Arduino nếu có
  if (arduinoSerial.available()) {
    String data = arduinoSerial.readStringUntil('\n');
    Serial.println("Nhận từ Arduino: " + data);
    processArduinoData(data);
  }
  
  delay(100);
}

void authenticateDevice() {
  WiFiClient client;
  HTTPClient http;
  
  Serial.println("Đang xác thực thiết bị...");
  
  http.begin(client, AUTH_URL);
  http.addHeader("Content-Type", "application/json");
  
  // Tạo JSON payload
  StaticJsonDocument<200> doc;
  doc["wemosSerial"] = WEMOS_SERIAL;
  doc["apiKey"] = API_KEY;
  doc["firmwareVersion"] = FIRMWARE_VERSION;
  
  String requestBody;
  serializeJson(doc, requestBody);
  
  int httpResponseCode = http.POST(requestBody);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Mã phản hồi HTTP: " + String(httpResponseCode));
    Serial.println("Phản hồi: " + response);
    
    // Parse JSON response
    StaticJsonDocument<512> responseDoc;
    DeserializationError error = deserializeJson(responseDoc, response);
    
    if (!error) {
      if (responseDoc["status"] == "success") {
        authToken = responseDoc["data"]["token"].as<String>();
        deviceId = responseDoc["data"]["device"]["id"].as<String>();
        Serial.println("Xác thực thành công!");
        Serial.println("Device ID: " + deviceId);
      } else {
        Serial.println("Xác thực thất bại: " + response);
      }
    } else {
      Serial.println("Lỗi phân tích JSON: " + String(error.c_str()));
    }
  } else {
    Serial.println("Lỗi gửi yêu cầu HTTP: " + String(httpResponseCode));
  }
  
  http.end();
}

void readSensorData() {
  // Gửi yêu cầu đọc cảm biến đến Arduino
  arduinoSerial.println("READ_SENSORS");
  
  // Đợi phản hồi từ Arduino (tối đa 5 giây)
  unsigned long startTime = millis();
  while (millis() - startTime < 5000) {
    if (arduinoSerial.available()) {
      String data = arduinoSerial.readStringUntil('\n');
      Serial.println("Dữ liệu cảm biến từ Arduino: " + data);
      
      // Phân tích dữ liệu và gửi lên server
      processSensorData(data);
      return;
    }
    delay(100);
  }
  
  Serial.println("Không nhận được phản hồi từ Arduino");
}

void processSensorData(String data) {
  // Định dạng dữ liệu từ Arduino: "SENSOR:temp:humi:soil:light"
  if (data.startsWith("SENSOR:")) {
    data = data.substring(7); // Bỏ "SENSOR:"
    
    int firstColon = data.indexOf(':');
    int secondColon = data.indexOf(':', firstColon + 1);
    int thirdColon = data.indexOf(':', secondColon + 1);
    
    if (firstColon > 0 && secondColon > 0 && thirdColon > 0) {
      float temperature = data.substring(0, firstColon).toFloat();
      float humidity = data.substring(firstColon + 1, secondColon).toFloat();
      float soilMoisture = data.substring(secondColon + 1, thirdColon).toFloat();
      float lightLevel = data.substring(thirdColon + 1).toFloat();
      
      // Gửi dữ liệu lên server
      sendSensorData(temperature, humidity, soilMoisture, lightLevel);
    }
  }
}

void sendSensorData(float temperature, float humidity, float soilMoisture, float lightLevel) {
  if (authToken.length() == 0) {
    Serial.println("Chưa xác thực, không thể gửi dữ liệu");
    authenticateDevice();
    return;
  }
  
  WiFiClient client;
  HTTPClient http;
  
  Serial.println("Đang gửi dữ liệu cảm biến...");
  
  http.begin(client, SENSOR_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + authToken);
  
  // Tạo JSON payload
  StaticJsonDocument<200> doc;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["soilMoisture"] = soilMoisture;
  doc["lightLevel"] = lightLevel;
  
  String requestBody;
  serializeJson(doc, requestBody);
  
  int httpResponseCode = http.POST(requestBody);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Mã phản hồi HTTP: " + String(httpResponseCode));
    Serial.println("Phản hồi: " + response);
  } else {
    Serial.println("Lỗi gửi yêu cầu HTTP: " + String(httpResponseCode));
    // Nếu lỗi 401, thử xác thực lại
    if (httpResponseCode == 401) {
      Serial.println("Token hết hạn, đang xác thực lại...");
      authenticateDevice();
    }
  }
  
  http.end();
}

void sendHeartbeat() {
  if (authToken.length() == 0 || deviceId.length() == 0) {
    Serial.println("Chưa xác thực, không thể gửi heartbeat");
    authenticateDevice();
    return;
  }
  
  WiFiClient client;
  HTTPClient http;
  
  Serial.println("Đang gửi heartbeat...");
  
  String url = String(HEARTBEAT_URL) + "/" + deviceId;
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + authToken);
  
  int httpResponseCode = http.POST("{}");
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Mã phản hồi HTTP: " + String(httpResponseCode));
    Serial.println("Phản hồi: " + response);
  } else {
    Serial.println("Lỗi gửi yêu cầu HTTP: " + String(httpResponseCode));
    // Nếu lỗi 401, thử xác thực lại
    if (httpResponseCode == 401) {
      Serial.println("Token hết hạn, đang xác thực lại...");
      authenticateDevice();
    }
  }
  
  http.end();
}

void checkControlStatus() {
  if (authToken.length() == 0) {
    Serial.println("Chưa xác thực, không thể kiểm tra trạng thái điều khiển");
    authenticateDevice();
    return;
  }
  
  WiFiClient client;
  HTTPClient http;
  
  Serial.println("Đang kiểm tra trạng thái điều khiển...");
  
  http.begin(client, CONTROL_URL);
  http.addHeader("Authorization", "Bearer " + authToken);
  
  int httpResponseCode = http.GET();
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Mã phản hồi HTTP: " + String(httpResponseCode));
    Serial.println("Phản hồi: " + response);
    
    // Parse JSON response
    StaticJsonDocument<512> doc;
    DeserializationError error = deserializeJson(doc, response);
    
    if (!error) {
      if (doc["status"] == "success") {
        bool newLedStatus = doc["data"]["ledStatus"];
        bool newFanStatus = doc["data"]["fanStatus"];
        bool newWaterPumpStatus = doc["data"]["waterPumpStatus"];
        bool newNutrientPumpStatus = doc["data"]["nutrientPumpStatus"];
        
        // Kiểm tra nếu có thay đổi trạng thái
        if (newLedStatus != ledStatus || 
            newFanStatus != fanStatus || 
            newWaterPumpStatus != waterPumpStatus || 
            newNutrientPumpStatus != nutrientPumpStatus) {
          
          // Cập nhật trạng thái
          ledStatus = newLedStatus;
          fanStatus = newFanStatus;
          waterPumpStatus = newWaterPumpStatus;
          nutrientPumpStatus = newNutrientPumpStatus;
          
          // Gửi lệnh điều khiển đến Arduino
          String command = "CONTROL:";
          command += ledStatus ? "1:" : "0:";
          command += fanStatus ? "1:" : "0:";
          command += waterPumpStatus ? "1:" : "0:";
          command += nutrientPumpStatus ? "1" : "0";
          
          arduinoSerial.println(command);
          Serial.println("Gửi lệnh điều khiển đến Arduino: " + command);
        }
      }
    } else {
      Serial.println("Lỗi phân tích JSON: " + String(error.c_str()));
    }
  } else {
    Serial.println("Lỗi gửi yêu cầu HTTP: " + String(httpResponseCode));
    // Nếu lỗi 401, thử xác thực lại
    if (httpResponseCode == 401) {
      Serial.println("Token hết hạn, đang xác thực lại...");
      authenticateDevice();
    }
  }
  
  http.end();
}

void processArduinoData(String data) {
  // Xử lý dữ liệu từ Arduino nếu cần
  // Ví dụ: Nếu Arduino gửi cảnh báo, bạn có thể gửi thông báo đến server
} 