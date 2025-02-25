/*
 * GardenAI - Arduino Uno Firmware
 * Đọc dữ liệu cảm biến và điều khiển thiết bị
 */

#include <DHT.h>

// Cấu hình chân cảm biến
#define DHTPIN 2          // Chân kết nối DHT11/DHT22
#define DHTTYPE DHT22     // Loại cảm biến DHT (DHT11 hoặc DHT22)
#define SOIL_MOISTURE A0  // Chân analog đọc cảm biến độ ẩm đất
#define LIGHT_SENSOR A1   // Chân analog đọc cảm biến ánh sáng

// Cấu hình chân điều khiển
#define LED_PIN 3         // Chân điều khiển đèn LED
#define FAN_PIN 4         // Chân điều khiển quạt
#define WATER_PUMP_PIN 5  // Chân điều khiển bơm nước
#define NUTRIENT_PUMP_PIN 6 // Chân điều khiển bơm dinh dưỡng

// Khởi tạo cảm biến DHT
DHT dht(DHTPIN, DHTTYPE);

void setup() {
  // Khởi tạo Serial để giao tiếp với Wemos D1
  Serial.begin(9600);
  
  // Khởi tạo chân điều khiển
  pinMode(LED_PIN, OUTPUT);
  pinMode(FAN_PIN, OUTPUT);
  pinMode(WATER_PUMP_PIN, OUTPUT);
  pinMode(NUTRIENT_PUMP_PIN, OUTPUT);
  
  // Tắt tất cả thiết bị khi khởi động
  digitalWrite(LED_PIN, LOW);
  digitalWrite(FAN_PIN, LOW);
  digitalWrite(WATER_PUMP_PIN, LOW);
  digitalWrite(NUTRIENT_PUMP_PIN, LOW);
  
  // Khởi tạo cảm biến DHT
  dht.begin();
  
  Serial.println("Arduino Uno đã sẵn sàng");
}

void loop() {
  // Kiểm tra nếu có lệnh từ Wemos D1
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    processCommand(command);
  }
  
  delay(100);
}

void processCommand(String command) {
  // Xử lý lệnh từ Wemos D1
  if (command == "READ_SENSORS") {
    // Đọc dữ liệu từ các cảm biến
    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();
    
    // Đọc độ ẩm đất (0-1023) và chuyển đổi thành phần trăm (0-100)
    int soilRaw = analogRead(SOIL_MOISTURE);
    float soilMoisture = map(soilRaw, 1023, 0, 0, 100); // Đảo ngược vì giá trị cao = khô
    
    // Đọc cường độ ánh sáng (0-1023) và chuyển đổi thành lux
    int lightRaw = analogRead(LIGHT_SENSOR);
    float lightLevel = map(lightRaw, 0, 1023, 0, 10000); // Giả định 0-10000 lux
    
    // Kiểm tra nếu có giá trị lỗi (NaN)
    if (isnan(temperature) || isnan(humidity)) {
      temperature = 0;
      humidity = 0;
    }
    
    // Gửi dữ liệu về Wemos D1
    String sensorData = "SENSOR:" + String(temperature, 1) + ":" + 
                        String(humidity, 1) + ":" + 
                        String(soilMoisture, 1) + ":" + 
                        String(lightLevel, 1);
    
    Serial.println(sensorData);
  }
  else if (command.startsWith("CONTROL:")) {
    // Định dạng: CONTROL:led:fan:water:nutrient (1=on, 0=off)
    command = command.substring(8); // Bỏ "CONTROL:"
    
    int firstColon = command.indexOf(':');
    int secondColon = command.indexOf(':', firstColon + 1);
    int thirdColon = command.indexOf(':', secondColon + 1);
    
    if (firstColon > 0 && secondColon > 0 && thirdColon > 0) {
      int ledStatus = command.substring(0, firstColon).toInt();
      int fanStatus = command.substring(firstColon + 1, secondColon).toInt();
      int waterPumpStatus = command.substring(secondColon + 1, thirdColon).toInt();
      int nutrientPumpStatus = command.substring(thirdColon + 1).toInt();
      
      // Điều khiển các thiết bị
      digitalWrite(LED_PIN, ledStatus);
      digitalWrite(FAN_PIN, fanStatus);
      digitalWrite(WATER_PUMP_PIN, waterPumpStatus);
      digitalWrite(NUTRIENT_PUMP_PIN, nutrientPumpStatus);
      
      // Gửi xác nhận về Wemos D1
      Serial.println("OK");
    }
  }
} 