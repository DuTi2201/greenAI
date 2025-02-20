"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAlertTemplate = void 0;
const date_fns_1 = require("date-fns");
const locale_1 = require("date-fns/locale");
const generateAlertTemplate = (data) => {
    const getIcon = (type) => {
        switch (type) {
            case 'error':
                return '🚨';
            case 'warning':
                return '⚠️';
            case 'success':
                return '✅';
            default:
                return '📝';
        }
    };
    const getColor = (type) => {
        switch (type) {
            case 'error':
                return '#dc2626';
            case 'warning':
                return '#d97706';
            case 'success':
                return '#16a34a';
            default:
                return '#2563eb';
        }
    };
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .alert { 
          background: ${getColor(data.type)}20;
          border-left: 4px solid ${getColor(data.type)};
          padding: 15px;
          border-radius: 4px;
        }
        .title {
          color: ${getColor(data.type)};
          font-size: 20px;
          font-weight: bold;
          margin: 0 0 10px 0;
        }
        .message { margin: 0 0 15px 0; }
        .details {
          background: #f5f5f5;
          padding: 10px;
          border-radius: 4px;
          margin-top: 15px;
        }
        .timestamp {
          color: #666;
          font-size: 14px;
          margin-top: 15px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="alert">
          <div class="title">
            ${getIcon(data.type)} ${data.title}
          </div>
          <div class="message">
            ${data.message}
          </div>

          ${data.deviceId ? `
            <div class="details">
              <strong>Thiết bị:</strong> ${data.deviceName}
            </div>
          ` : ''}

          ${data.sensorData ? `
            <div class="details">
              <strong>Dữ liệu cảm biến:</strong><br>
              ${data.sensorData.temperature ? `Nhiệt độ: ${data.sensorData.temperature}°C<br>` : ''}
              ${data.sensorData.humidity ? `Độ ẩm không khí: ${data.sensorData.humidity}%<br>` : ''}
              ${data.sensorData.soilMoisture ? `Độ ẩm đất: ${data.sensorData.soilMoisture}%<br>` : ''}
              ${data.sensorData.light ? `Ánh sáng: ${data.sensorData.light} Lux` : ''}
            </div>
          ` : ''}

          <div class="timestamp">
            ${(0, date_fns_1.format)(data.timestamp, 'HH:mm - dd/MM/yyyy', { locale: locale_1.vi })}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};
exports.generateAlertTemplate = generateAlertTemplate;
