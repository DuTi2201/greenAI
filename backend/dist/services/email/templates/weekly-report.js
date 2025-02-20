"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateWeeklyReportTemplate = void 0;
const date_fns_1 = require("date-fns");
const locale_1 = require("date-fns/locale");
const generateWeeklyReportTemplate = (data) => {
    const formatNumber = (num) => new Intl.NumberFormat('vi-VN').format(num);
    const formatPercent = (current, previous) => {
        const percent = ((current - previous) / previous) * 100;
        return percent > 0 ? `↑ ${percent.toFixed(1)}%` : `↓ ${Math.abs(percent).toFixed(1)}%`;
    };
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .section { margin-bottom: 30px; }
        .card { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 15px; }
        .stat { font-size: 24px; font-weight: bold; color: #2563eb; }
        .label { font-size: 14px; color: #666; }
        .device-list { list-style: none; padding: 0; }
        .device-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .recommendation { background: #e6f3ff; padding: 15px; border-radius: 8px; margin-bottom: 10px; }
        .up { color: #16a34a; }
        .down { color: #dc2626; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌿 Báo cáo tuần - GreenAI Garden</h1>
          <p>${(0, date_fns_1.format)(data.startDate, 'dd/MM/yyyy', { locale: locale_1.vi })} - ${(0, date_fns_1.format)(data.endDate, 'dd/MM/yyyy', { locale: locale_1.vi })}</p>
        </div>

        <div class="section">
          <h2>📊 Tổng quan tiêu thụ</h2>
          
          <div class="card">
            <div class="stat">${formatNumber(data.energyUsage.total)} kWh</div>
            <div class="label">
              Điện năng tiêu thụ 
              <span class="${data.energyUsage.total > data.energyUsage.previousWeek ? 'up' : 'down'}">
                ${formatPercent(data.energyUsage.total, data.energyUsage.previousWeek)}
              </span>
            </div>
          </div>

          <div class="card">
            <div class="stat">${formatNumber(data.waterUsage.total)} lít</div>
            <div class="label">
              Nước tiêu thụ
              <span class="${data.waterUsage.total > data.waterUsage.previousWeek ? 'up' : 'down'}">
                ${formatPercent(data.waterUsage.total, data.waterUsage.previousWeek)}
              </span>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>⚡ Chi tiết thiết bị</h2>
          <div class="card">
            <ul class="device-list">
              ${data.energyUsage.byDevice.map((device) => `
                <li class="device-item">
                  <span>${device.deviceName}</span>
                  <span>${device.powerUsage.toFixed(1)} kWh (${device.hoursActive.toFixed(1)}h)</span>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>

        <div class="section">
          <h2>💧 Chi tiết máy bơm</h2>
          <div class="card">
            <ul class="device-list">
              ${data.waterUsage.byPump.map((pump) => `
                <li class="device-item">
                  <span>${pump.pumpName}</span>
                  <span>${pump.liters.toFixed(1)} lít (${pump.hoursActive.toFixed(1)}h)</span>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>

        <div class="section">
          <h2>📈 Hiệu suất cảm biến</h2>
          <div class="card">
            <ul class="device-list">
              ${data.sensorStats.map((sensor) => `
                <li class="device-item">
                  <span>${sensor.sensorName}</span>
                  <span>${sensor.uptime}% uptime (${sensor.readings} readings)</span>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>

        <div class="section">
          <h2>🎯 Dự báo & Đề xuất</h2>
          <div class="card">
            <p>Dự kiến tuần tới:</p>
            <ul>
              <li>Điện năng: ${formatNumber(data.energyUsage.prediction)} kWh</li>
              <li>Nước: ${formatNumber(data.waterUsage.prediction)} lít</li>
            </ul>
          </div>

          ${data.recommendations.map((rec) => `
            <div class="recommendation">
              <h3>${rec.title}</h3>
              <p>${rec.description}</p>
              ${rec.savings.energy ? `<p>Tiết kiệm điện: ${rec.savings.energy} kWh</p>` : ''}
              ${rec.savings.water ? `<p>Tiết kiệm nước: ${rec.savings.water} lít</p>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    </body>
    </html>
  `;
};
exports.generateWeeklyReportTemplate = generateWeeklyReportTemplate;
