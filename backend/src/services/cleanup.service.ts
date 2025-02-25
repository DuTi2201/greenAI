import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';
import { db } from '../singleton';
import { Prisma } from '@prisma/client';

/**
 * Service xử lý việc dọn dẹp các file và dữ liệu cũ
 */
export class CleanupService {
  /**
   * Dọn dẹp các file PDF báo cáo cũ
   * @param maxAgeInDays Số ngày tối đa để giữ file (mặc định 30 ngày)
   */
  async cleanupOldPdfFiles(maxAgeInDays: number = 30): Promise<number> {
    try {
      const reportsDir = path.join(process.cwd(), 'reports');
      
      // Kiểm tra thư mục tồn tại
      if (!fs.existsSync(reportsDir)) {
        logger.info('Reports directory does not exist, nothing to clean up');
        return 0;
      }
      
      // Lấy danh sách file trong thư mục
      const files = fs.readdirSync(reportsDir);
      
      // Tính thời gian tối đa
      const maxAge = new Date();
      maxAge.setDate(maxAge.getDate() - maxAgeInDays);
      
      let deletedCount = 0;
      
      // Lấy danh sách báo cáo có file PDF bằng raw query
      const reports = await db.$queryRaw`
        SELECT id, "pdfPath" FROM "AIReport" 
        WHERE "pdfPath" IS NOT NULL
      ` as any[];
      
      // Tạo map các file PDF đang được sử dụng
      const activePdfFiles = new Map<string, string>();
      reports.forEach(report => {
        if (report.pdfPath) {
          activePdfFiles.set(report.pdfPath, report.id);
        }
      });
      
      // Duyệt qua từng file
      for (const file of files) {
        // Chỉ xử lý file PDF
        if (!file.endsWith('.pdf')) continue;
        
        const filePath = path.join(reportsDir, file);
        const stats = fs.statSync(filePath);
        
        // Kiểm tra file có đang được sử dụng không
        const isActive = activePdfFiles.has(file);
        
        // Nếu file cũ hơn maxAge và không được sử dụng, xóa file
        if (stats.mtime < maxAge && !isActive) {
          fs.unlinkSync(filePath);
          deletedCount++;
          logger.debug(`Deleted old PDF file: ${file}`);
        }
      }
      
      logger.info(`Cleaned up ${deletedCount} old PDF files`);
      return deletedCount;
    } catch (error) {
      logger.error('Error cleaning up old PDF files:', error);
      return 0;
    }
  }
  
  /**
   * Dọn dẹp dữ liệu cảm biến cũ
   * @param maxAgeInDays Số ngày tối đa để giữ dữ liệu (mặc định 90 ngày)
   */
  async cleanupOldSensorData(maxAgeInDays: number = 90): Promise<number> {
    try {
      // Tính thời gian tối đa
      const maxAge = new Date();
      maxAge.setDate(maxAge.getDate() - maxAgeInDays);
      
      // Xóa dữ liệu cũ
      const result = await db.sensorData.deleteMany({
        where: {
          recordedAt: {
            lt: maxAge
          }
        }
      });
      
      logger.info(`Cleaned up ${result.count} old sensor data records`);
      return result.count;
    } catch (error) {
      logger.error('Error cleaning up old sensor data:', error);
      return 0;
    }
  }
  
  /**
   * Dọn dẹp lịch sử trạng thái thiết bị cũ
   * @param maxAgeInDays Số ngày tối đa để giữ dữ liệu (mặc định 60 ngày)
   */
  async cleanupOldDeviceHistory(maxAgeInDays: number = 60): Promise<number> {
    try {
      // Tính thời gian tối đa
      const maxAge = new Date();
      maxAge.setDate(maxAge.getDate() - maxAgeInDays);
      
      // Xóa dữ liệu cũ
      const result = await db.deviceStatusHistory.deleteMany({
        where: {
          changedAt: {
            lt: maxAge
          }
        }
      });
      
      logger.info(`Cleaned up ${result.count} old device history records`);
      return result.count;
    } catch (error) {
      logger.error('Error cleaning up old device history:', error);
      return 0;
    }
  }
}

export const cleanupService = new CleanupService(); 