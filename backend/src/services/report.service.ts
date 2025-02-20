import { startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import { WeeklyStats } from '../types/report.types';
import { Device, DeviceType, DeviceAction } from '../models/Device';
import { SensorData } from '../models/SensorData';
import { geminiService } from '../services/ai/gemini.service';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import { Op } from 'sequelize';

// Thêm font hỗ trợ tiếng Việt
const fontPath = {
  regular: 'src/assets/fonts/NotoSans-Regular.ttf',
  bold: 'src/assets/fonts/NotoSans-Bold.ttf',
  italic: 'src/assets/fonts/NotoSans-Italic.ttf'
};

interface UsageData {
  energy: {
    total: number;
    byDevice: Array<{
      deviceId: string;
      deviceName: string;
      powerUsage: number;
      hoursActive: number;
    }>;
  };
  water: {
    total: number;
    byPump: Array<{
      pumpId: string;
      pumpName: string;
      liters: number;
      hoursActive: number;
    }>;
  };
  prediction: {
    energy: number;
    water: number;
  };
  previousEnergy: {
    total: number;
    byDevice: Array<{
      deviceId: string;
      deviceName: string;
      powerUsage: number;
      hoursActive: number;
    }>;
  };
  previousWater: {
    total: number;
    byPump: Array<{
      pumpId: string;
      pumpName: string;
      liters: number;
      hoursActive: number;
    }>;
  };
}

class ReportService {
  async generateWeeklyStats(date: Date): Promise<WeeklyStats> {
    const startDate = startOfWeek(date);
    const endDate = endOfWeek(date);
    const previousStartDate = startOfWeek(subWeeks(date, 1));
    const previousEndDate = endOfWeek(subWeeks(date, 1));

    // Lấy dữ liệu thiết bị và cảm biến
    const devices = await Device.findAll();
    const sensorData = await SensorData.findAll({
      where: {
        timestamp: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    // Tính toán thống kê năng lượng
    const energyUsage = await this.calculateEnergyUsage(devices, startDate, endDate);
    const previousEnergyUsage = await this.calculateEnergyUsage(devices, previousStartDate, previousEndDate);

    // Tính toán thống kê nước
    const waterUsage = await this.calculateWaterUsage(devices, startDate, endDate);
    const previousWaterUsage = await this.calculateWaterUsage(devices, previousStartDate, previousEndDate);

    // Tính toán hiệu suất cảm biến
    const sensorStats = await this.calculateSensorStats(sensorData);

    // Phân tích mẫu sử dụng và tạo đề xuất
    const usageData = await this.generateUsageData(
      energyUsage,
      waterUsage,
      previousEnergyUsage,
      previousWaterUsage
    );
    
    const recommendations = await geminiService.analyzeUsagePatterns(usageData);

    return {
      startDate,
      endDate,
      energyUsage: {
        total: energyUsage.total,
        byDevice: energyUsage.devices,
        previousWeek: previousEnergyUsage.total,
        prediction: this.predictNextWeekUsage(energyUsage.total, previousEnergyUsage.total)
      },
      waterUsage: {
        total: waterUsage.total,
        byPump: waterUsage.pumps,
        previousWeek: previousWaterUsage.total,
        prediction: this.predictNextWeekUsage(waterUsage.total, previousWaterUsage.total)
      },
      sensorStats,
      recommendations
    };
  }

  private async calculateEnergyUsage(devices: Device[], startDate: Date, endDate: Date) {
    let total = 0;
    const deviceStats = [];

    for (const device of devices) {
      if (device.metadata?.power) {
        const activeMinutes = this.calculateActiveMinutes(device.lastAction || null);
        const hoursActive = activeMinutes / 60;
        const usage = device.calculateEnergyConsumption(hoursActive);
        total += usage;
        
        if (usage > 0) {
          deviceStats.push({
            deviceId: device.id,
            deviceName: device.name,
            powerUsage: usage,
            hoursActive
          });
        }
      }
    }

    return { total, devices: deviceStats };
  }

  private async calculateWaterUsage(devices: Device[], startDate: Date, endDate: Date) {
    let total = 0;
    const pumpStats = [];

    for (const device of devices) {
      if (device.type === DeviceType.WATER_PUMP && device.metadata?.flowRate) {
        const activeMinutes = this.calculateActiveMinutes(device.lastAction || null);
        const usage = device.calculateWaterConsumption(activeMinutes);
        const hoursActive = activeMinutes / 60;
        total += usage;
        
        if (usage > 0) {
          pumpStats.push({
            pumpId: device.id,
            pumpName: device.name,
            liters: usage,
            hoursActive
          });
        }
      }
    }

    return { total, pumps: pumpStats };
  }

  private calculateActiveMinutes(action: DeviceAction | null): number {
    if (!action || !action.duration || isNaN(action.duration)) {
      return 0;
    }
    return Math.max(0, Number(action.duration));
  }

  private calculateSensorStats(sensorData: SensorData[]) {
    const stats = new Map<string, {
      sensorName: string,
      readings: number,
      uptime: number,
      accuracy: number
    }>();

    for (const reading of sensorData) {
      const current = stats.get(reading.deviceId) || {
        sensorName: reading.metadata?.sensorType || 'Unknown',
        readings: 0,
        uptime: 0,
        accuracy: 0
      };

      current.readings++;
      current.accuracy = this.calculateAccuracy(reading);
      
      stats.set(reading.deviceId, current);
    }

    return Array.from(stats.entries()).map(([sensorId, data]) => ({
      sensorId,
      ...data
    }));
  }

  private calculateAccuracy(reading: SensorData): number {
    // Thêm logic tính toán độ chính xác thực tế ở đây
    const accuracy = 95; // Giá trị mẫu
    return isNaN(accuracy) ? 0 : Math.min(100, Math.max(0, accuracy));
  }

  private predictNextWeekUsage(currentUsage: number, previousUsage: number): number {
    // Kiểm tra giá trị hợp lệ
    if (isNaN(currentUsage) || isNaN(previousUsage) || previousUsage <= 0) {
      return currentUsage || 0;
    }
    // Logic dự đoán đơn giản dựa trên xu hướng
    const trend = (currentUsage - previousUsage) / previousUsage;
    const prediction = currentUsage * (1 + trend);
    return isNaN(prediction) ? currentUsage : Math.max(0, prediction);
  }

  async generatePDF(stats: WeeklyStats): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 40,
          info: {
            Title: 'Báo cáo tuần GreenAI',
            Author: 'GreenAI System',
            Producer: 'GreenAI PDF Generator',
            Creator: 'GreenAI System'
          },
          bufferPages: true
        });

        // Đăng ký font chữ
        doc.registerFont('NotoSans', fontPath.regular);
        doc.registerFont('NotoSans-Bold', fontPath.bold);
        doc.registerFont('NotoSans-Italic', fontPath.italic);

        // Cấu hình font mặc định
        doc.font('NotoSans').fontSize(12);

        const chunks: Buffer[] = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header với logo và tiêu đề
        this.drawHeader(doc, stats);

        // Tóm tắt điểm chính
        this.drawSummary(doc, stats);

        // Phần nội dung chính
        const contentStartY = doc.y + 30;
        doc.moveTo(50, contentStartY)
           .lineTo(550, contentStartY)
           .lineWidth(1)
           .strokeColor('#EEEEEE')
           .stroke();

        // Energy Usage Section
        this.addSection(doc, '⚡ Thống kê năng lượng', () => {
          this.renderEnergySection(doc, stats.energyUsage);
        });

        // Water Usage Section
        this.addSection(doc, '💧 Thống kê nước', () => {
          this.renderWaterSection(doc, stats.waterUsage);
        });

        // Sensor Stats Section
        if (stats.sensorStats?.length) {
          this.addSection(doc, '📊 Hiệu suất cảm biến', () => {
            this.renderSensorSection(doc, stats.sensorStats);
          });
        }

        // Recommendations Section
        if (stats.recommendations?.length) {
          this.addSection(doc, '💡 Đề xuất tối ưu', () => {
            this.renderRecommendations(doc, stats.recommendations);
          });
        }

        // Thêm footer cho tất cả các trang
        let pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);
          this.drawFooter(doc, i + 1, pages.count);
        }

        doc.end();
      } catch (error) {
        console.error('Lỗi khi tạo PDF:', error);
        reject(error);
      }
    });
  }

  private drawHeader(doc: PDFKit.PDFDocument, stats: WeeklyStats) {
    // Vẽ header background
    doc.rect(0, 0, doc.page.width, 100)
       .fill('#f8f9fa');
    
    // Logo và tiêu đề
    doc.font('NotoSans-Bold')
       .fontSize(24)
       .fillColor('#2E7D32')
       .text('BÁO CÁO TUẦN GREENAI', 50, 40, {
         align: 'center'
       });

    // Thời gian báo cáo
    doc.font('NotoSans')
       .fontSize(14)
       .fillColor('#666666')
       .text(`Từ ${this.formatDate(stats.startDate)} đến ${this.formatDate(stats.endDate)}`, {
         align: 'center'
       });

    doc.y = 120; // Đặt vị trí bắt đầu nội dung
  }

  private drawSummary(doc: PDFKit.PDFDocument, stats: WeeklyStats) {
    doc.rect(50, doc.y, 500, 100)
       .fillColor('#f1f8ff')
       .fill();

    doc.font('NotoSans-Bold')
       .fontSize(14)
       .fillColor('#2E7D32')
       .text('Tóm tắt điểm chính:', 70, doc.y - 90);

    doc.font('NotoSans')
       .fontSize(12)
       .fillColor('#333333');

    const energyChange = ((stats.energyUsage.total - stats.energyUsage.previousWeek) / stats.energyUsage.previousWeek * 100).toFixed(1);
    const waterChange = ((stats.waterUsage.total - stats.waterUsage.previousWeek) / stats.waterUsage.previousWeek * 100).toFixed(1);

    const summaryY = doc.y + 10;
    doc.text(`• Tiêu thụ điện: ${this.formatNumber(stats.energyUsage.total)} kWh (${energyChange}% so với tuần trước)`, 90, summaryY);
    doc.text(`• Tiêu thụ nước: ${this.formatNumber(stats.waterUsage.total)} lít (${waterChange}% so với tuần trước)`, 90, summaryY + 20);
    
    if (stats.recommendations.length > 0) {
      doc.text(`• ${stats.recommendations.length} đề xuất tối ưu có thể tiết kiệm năng lượng và nước`, 90, summaryY + 40);
    }

    doc.moveDown(2);
  }

  private drawFooter(doc: PDFKit.PDFDocument, pageNumber: number, totalPages: number) {
    const footerY = doc.page.height - 50;
    
    // Đường kẻ phân cách
    doc.moveTo(50, footerY - 10)
       .lineTo(550, footerY - 10)
       .lineWidth(0.5)
       .strokeColor('#CCCCCC')
       .stroke();

    doc.font('NotoSans')
       .fontSize(9)
       .fillColor('#666666');

    // Thông tin hệ thống bên trái
    doc.text('Hệ thống giám sát thông minh GreenAI', 50, footerY);

    // Số trang bên phải
    doc.text(`Trang ${pageNumber}/${totalPages}`, 0, footerY, {
      align: 'right',
      width: doc.page.width - 50
    });
  }

  private formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  private addSection(doc: PDFKit.PDFDocument, title: string, content: () => void) {
    try {
      doc.moveDown(2);
      doc.font('NotoSans-Bold')
         .fontSize(16)
         .fillColor('#2E7D32')
         .text(title, { 
           indent: 10
         });
      doc.moveDown();
      doc.font('NotoSans')
         .fontSize(12)
         .fillColor('#000000');
      content();
    } catch (error) {
      console.error(`Lỗi khi thêm section ${title}:`, error);
      doc.text('Không thể hiển thị phần này do lỗi dữ liệu');
    }
  }

  private renderEnergySection(doc: PDFKit.PDFDocument, energyUsage: any) {
    const { total, previousWeek, prediction, byDevice } = energyUsage;
    
    doc.font('NotoSans')
       .fontSize(12)
       .fillColor('#000000')
       .text(`Tổng tiêu thụ: ${this.formatNumber(total)} kWh`, { indent: 20 });

    if (previousWeek > 0) {
      const diff = ((total - previousWeek) / previousWeek * 100);
      doc.fillColor(diff >= 0 ? '#ef4444' : '#22c55e')
         .text(`So với tuần trước: ${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`, { 
           indent: 20
         });
    }

    doc.fillColor('#000000')
       .text(`Dự đoán tuần tới: ${this.formatNumber(prediction)} kWh`, { indent: 20 });

    if (byDevice?.length) {
      doc.moveDown();
      this.drawBarChart(doc, byDevice.map((d: any) => ({
        label: d.deviceName,
        value: d.powerUsage,
        color: '#3b82f6'
      })), 'kWh');

      doc.moveDown();
      this.renderTable(
        doc, 
        ['Thiết bị', 'Điện năng', 'Thời gian'],
        byDevice.map((d: any) => [
          d.deviceName,
          `${this.formatNumber(d.powerUsage)} kWh`,
          `${this.formatNumber(d.hoursActive)}h`
        ])
      );
    }
  }

  private renderWaterSection(doc: PDFKit.PDFDocument, waterUsage: any) {
    const { total, previousWeek, prediction, byPump } = waterUsage;
    
    doc.font('NotoSans')
       .fontSize(12)
       .fillColor('#000000')
       .text(`Tổng tiêu thụ: ${this.formatNumber(total)} lít`, { indent: 20 });

    if (previousWeek > 0) {
      const diff = ((total - previousWeek) / previousWeek * 100);
      doc.fillColor(diff >= 0 ? '#ef4444' : '#22c55e')
         .text(`So với tuần trước: ${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`, { 
           indent: 20
         });
    }

    doc.fillColor('#000000')
       .text(`Dự đoán tuần tới: ${this.formatNumber(prediction)} lít`, { indent: 20 });

    if (byPump?.length) {
      doc.moveDown();
      this.drawBarChart(doc, byPump.map((p: any) => ({
        label: p.pumpName,
        value: p.liters,
        color: '#10b981'
      })), 'lít');

      doc.moveDown();
      this.renderTable(
        doc, 
        ['Máy bơm', 'Nước', 'Thời gian'],
        byPump.map((p: any) => [
          p.pumpName,
          `${this.formatNumber(p.liters)} lít`,
          `${this.formatNumber(p.hoursActive)}h`
        ])
      );
    }
  }

  private renderSensorSection(doc: PDFKit.PDFDocument, sensorStats: any[]) {
    this.renderTable(
      doc,
      ['Cảm biến', 'Độ chính xác', 'Số lần đọc', 'Uptime'],
      sensorStats.map(sensor => [
        sensor.sensorName,
        `${this.formatNumber(sensor.accuracy)}%`,
        String(sensor.readings),
        `${this.formatNumber(sensor.uptime)}%`
      ])
    );
  }

  private renderRecommendations(doc: PDFKit.PDFDocument, recommendations: any[]) {
    recommendations.forEach((rec, index) => {
      // Vẽ hộp chứa đề xuất
      const boxStartY = doc.y;
      doc.rect(50, boxStartY, 500, 100)
         .fillColor('#f8f9fa')
         .fill();

      // Tiêu đề đề xuất
      doc.font('NotoSans-Bold')
         .fontSize(13)
         .fillColor('#2E7D32')
         .text(`${index + 1}. ${rec.title}`, 70, boxStartY + 15, {
           width: 460
         });

      // Mô tả đề xuất
      const descriptionY = doc.y + 5;
      doc.font('NotoSans')
         .fontSize(11)
         .fillColor('#333333')
         .text(rec.description, 70, descriptionY, {
           width: 460,
           lineGap: 2
         });
      
      // Thông tin tiết kiệm
      if (rec.savings) {
        const savingsStartY = doc.y + 10;
        
        // Vẽ hộp chứa thông tin tiết kiệm
        doc.rect(70, savingsStartY, 460, 40)
           .fillColor('#E8F5E9')
           .fill();

        doc.font('NotoSans-Bold')
           .fontSize(11)
           .fillColor('#1B5E20')
           .text('Tiết kiệm dự kiến:', 90, savingsStartY + 12);

        let savingsText = '';
        if (rec.savings.energy) {
          savingsText += `${this.formatNumber(rec.savings.energy)} kWh điện`;
        }
        if (rec.savings.water) {
          savingsText += savingsText ? ' và ' : '';
          savingsText += `${this.formatNumber(rec.savings.water)} lít nước`;
        }

        doc.font('NotoSans')
           .fontSize(11)
           .fillColor('#2E7D32')
           .text(savingsText, 220, savingsStartY + 12, {
             width: 290
           });
      }

      doc.moveDown(2);
    });
  }

  private formatNumber(value: number): string {
    return isNaN(value) ? '0.00' : value.toFixed(2);
  }

  private drawBarChart(doc: PDFKit.PDFDocument, data: Array<{ label: string; value: number; color: string }>, unit: string) {
    const chartMargin = 60;
    const chartWidth = doc.page.width - chartMargin * 2;
    const maxValue = Math.max(...data.map(d => d.value)) || 1;
    const barHeight = 35;
    const barSpacing = 20;
    const cornerRadius = 5;

    let y = doc.y + 20;
    
    // Vẽ trục Y
    doc.strokeColor('#CCCCCC')
       .lineWidth(0.5)
       .moveTo(chartMargin, y - 10)
       .lineTo(chartMargin, y + (barHeight + barSpacing) * data.length)
       .stroke();

    // Vẽ các thanh và nhãn
    data.forEach((item, index) => {
      const barWidth = (item.value / maxValue) * (chartWidth - 100); // Để lại không gian cho nhãn
      
      // Vẽ thanh với góc bo tròn
      doc.roundedRect(chartMargin, y, barWidth, barHeight, cornerRadius)
         .fillOpacity(0.8)
         .fill(item.color)
         .fillOpacity(1);
         
      // Nhãn giá trị
      doc.font('NotoSans-Bold')
         .fontSize(11)
         .fillColor('#FFFFFF')
         .text(
           `${this.formatNumber(item.value)} ${unit}`, 
           chartMargin + 10, 
           y + barHeight/2 - 6,
           { width: barWidth - 20, align: 'left' }
         );
         
      // Tên thiết bị
      doc.font('NotoSans')
         .fontSize(11)
         .fillColor('#333333')
         .text(
           item.label, 
           chartMargin + barWidth + 15, 
           y + barHeight/2 - 6,
           { width: 200 }
         );

      y += barHeight + barSpacing;
    });

    // Vẽ trục X
    const xAxisY = y - barSpacing;
    doc.strokeColor('#CCCCCC')
       .lineWidth(0.5)
       .moveTo(chartMargin, xAxisY)
       .lineTo(chartMargin + chartWidth - 100, xAxisY)
       .stroke();

    // Thêm đơn vị đo
    doc.font('NotoSans-Italic')
       .fontSize(10)
       .fillColor('#666666')
       .text(
         `Đơn vị: ${unit}`,
         chartMargin,
         xAxisY + 10,
         { align: 'left' }
       );

    doc.y = y + 30;
  }

  private renderTable(doc: PDFKit.PDFDocument, headers: string[], rows: string[][]) {
    const colWidths = headers.map(() => (doc.page.width - 100) / headers.length);
    const rowHeight = 35;
    const startX = 50;
    const startY = doc.y + 15;
    const cornerRadius = 5;

    // Vẽ khung bảng
    doc.roundedRect(startX, startY, doc.page.width - 100, rowHeight * (rows.length + 1), cornerRadius)
       .strokeColor('#CCCCCC')
       .lineWidth(0.5)
       .stroke();

    // Header với nền xanh và góc bo tròn phía trên
    doc.roundedRect(startX, startY, doc.page.width - 100, rowHeight, cornerRadius)
       .fill('#2E7D32');

    doc.font('NotoSans-Bold')
       .fontSize(11)
       .fillColor('#FFFFFF');

    headers.forEach((header, i) => {
      doc.text(
        header,
        startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0) + 10,
        startY + 10,
        { width: colWidths[i] - 20, align: 'left' }
      );
    });

    // Rows với màu nền xen kẽ
    let currentY = startY + rowHeight;
    rows.forEach((row, rowIndex) => {
      if (rowIndex % 2 === 0) {
        doc.rect(startX, currentY, doc.page.width - 100, rowHeight)
           .fill('#f8f9fa');
      }

      doc.font('NotoSans')
         .fontSize(10)
         .fillColor('#333333');

      row.forEach((cell, colIndex) => {
        doc.text(
          cell,
          startX + colWidths.slice(0, colIndex).reduce((a, b) => a + b, 0) + 10,
          currentY + 10,
          { width: colWidths[colIndex] - 20, align: 'left' }
        );
      });

      // Vẽ đường kẻ ngang giữa các dòng
      if (rowIndex < rows.length - 1) {
        doc.moveTo(startX, currentY + rowHeight)
           .lineTo(startX + doc.page.width - 100, currentY + rowHeight)
           .strokeColor('#EEEEEE')
           .lineWidth(0.5)
           .stroke();
      }

      currentY += rowHeight;
    });

    doc.y = currentY + 30;
  }

  private async generateUsageData(
    energyUsage: any,
    waterUsage: any,
    previousEnergyUsage: any,
    previousWaterUsage: any
  ): Promise<UsageData> {
    return {
      energy: {
        total: energyUsage.total,
        byDevice: energyUsage.devices
      },
      water: {
        total: waterUsage.total,
        byPump: waterUsage.pumps
      },
      previousEnergy: {
        total: previousEnergyUsage.total,
        byDevice: previousEnergyUsage.devices
      },
      previousWater: {
        total: previousWaterUsage.total,
        byPump: previousWaterUsage.pumps
      },
      prediction: {
        energy: this.predictNextWeekUsage(energyUsage.total, previousEnergyUsage.total),
        water: this.predictNextWeekUsage(waterUsage.total, previousWaterUsage.total)
      }
    };
  }
}

export default new ReportService(); 