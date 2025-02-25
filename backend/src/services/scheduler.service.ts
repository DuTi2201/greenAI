import cron from 'node-cron';
import type { Schedule } from '../types';
import { db } from '../singleton';
import { controlDevice } from './device.service';
import { generateWeeklyReport, cleanupOldReports } from './ai.service';
import { pdfService } from './pdf.service';
import { emailService } from './email.service';
import { analyzeGardenData } from './ai.service';
import { logger } from '../utils/logger';
import path from 'path';

// Lưu trữ các jobs đang chạy
const runningJobs: { [key: string]: cron.ScheduledTask } = {};

/**
 * Đăng ký một scheduled job mới
 * @param schedule Thông tin lịch cần đăng ký
 */
export const scheduleJob = async (schedule: Schedule) => {
  // Hủy job cũ nếu có
  if (runningJobs[schedule.id]) {
    runningJobs[schedule.id].stop();
    delete runningJobs[schedule.id];
  }

  // Tạo job mới
  const job = cron.schedule(schedule.cronExpression, async () => {
    try {
      // Kiểm tra lại lịch có còn active không
      const currentSchedule = await db.schedule.findUnique({
        where: { id: schedule.id }
      });

      if (!currentSchedule || !currentSchedule.isActive) {
        job.stop();
        delete runningJobs[schedule.id];
        return;
      }

      // Thực hiện điều khiển thiết bị
      const garden = await db.garden.findUnique({
        where: { id: schedule.gardenId }
      });
      if (!garden) {
        throw new Error('Garden not found');
      }
      await controlDevice(schedule.gardenId, garden.userId, {
        [schedule.deviceType]: schedule.actionStatus
      });
    } catch (error) {
      console.error(`Schedule job error (${schedule.id}):`, error);
    }
  });

  // Lưu job vào danh sách đang chạy
  runningJobs[schedule.id] = job;
};

/**
 * Hủy một scheduled job
 * @param scheduleId ID của lịch cần hủy
 */
export const cancelJob = (scheduleId: string) => {
  if (runningJobs[scheduleId]) {
    runningJobs[scheduleId].stop();
    delete runningJobs[scheduleId];
  }
};

/**
 * Khởi động lại tất cả các scheduled jobs
 * Được gọi khi server khởi động
 */
export const initializeScheduler = async () => {
  try {
    // Lấy tất cả các lịch đang active
    const activeSchedules = await db.schedule.findMany({
      where: { isActive: true }
    });

    // Đăng ký lại các jobs
    for (const schedule of activeSchedules) {
      await scheduleJob(schedule);
    }

    console.log(`Initialized ${activeSchedules.length} scheduled jobs`);

    // Đăng ký job tạo báo cáo AI hàng tuần (chạy vào 0h Chủ nhật)
    cron.schedule('0 0 * * 0', async () => {
      try {
        console.log('Running weekly AI report generation job');
        
        // Lấy tất cả các vườn đang active
        const activeGardens = await db.garden.findMany({
          where: { status: 'active' }
        });
        
        // Tạo báo cáo cho từng vườn
        for (const garden of activeGardens) {
          await generateWeeklyReport(garden.id);
        }
      } catch (error) {
        console.error('Weekly AI report generation job error:', error);
      }
    });

    // Đăng ký job xóa báo cáo AI cũ (chạy vào 1h ngày 1 hàng tháng)
    cron.schedule('0 1 1 * *', async () => {
      try {
        console.log('Running AI report cleanup job');
        await cleanupOldReports();
      } catch (error) {
        console.error('AI report cleanup job error:', error);
      }
    });
  } catch (error) {
    console.error('Initialize scheduler error:', error);
  }
};

class SchedulerService {
  private tasks: Map<string, cron.ScheduledTask> = new Map();
  
  constructor() {
    this.initializeScheduledReports();
  }
  
  /**
   * Khởi tạo tất cả các lịch trình báo cáo từ cơ sở dữ liệu
   */
  async initializeScheduledReports() {
    try {
      // Lấy tất cả các lịch trình báo cáo đang hoạt động
      const schedules = await db.reportSchedule.findMany({
        where: { isActive: true },
        include: { garden: true }
      });
      
      logger.info(`Initializing ${schedules.length} report schedules`);
      
      // Tạo task cho mỗi lịch trình
      schedules.forEach(schedule => {
        this.scheduleReport(schedule);
      });
    } catch (error) {
      logger.error('Failed to initialize scheduled reports:', error);
    }
  }
  
  /**
   * Lên lịch cho một báo cáo
   */
  scheduleReport(schedule: any) {
    try {
      // Hủy task cũ nếu có
      if (this.tasks.has(schedule.id)) {
        this.tasks.get(schedule.id)?.stop();
        this.tasks.delete(schedule.id);
      }
      
      // Tạo biểu thức cron dựa trên tần suất
      const cronExpression = this.getCronExpression(schedule);
      
      if (!cronExpression) {
        logger.warn(`Invalid schedule configuration for schedule ID: ${schedule.id}`);
        return;
      }
      
      logger.info(`Scheduling report for garden ${schedule.gardenId} with cron: ${cronExpression}`);
      
      // Tạo task mới
      const task = cron.schedule(cronExpression, async () => {
        await this.generateAndSendReport(schedule);
      });
      
      // Lưu task
      this.tasks.set(schedule.id, task);
    } catch (error) {
      logger.error(`Failed to schedule report for ID ${schedule.id}:`, error);
    }
  }
  
  /**
   * Tạo và gửi báo cáo
   */
  async generateAndSendReport(schedule: any) {
    try {
      logger.info(`Generating scheduled report for garden ${schedule.gardenId}`);
      
      // Tính toán khoảng thời gian phân tích
      const endDate = new Date();
      let startDate = new Date();
      
      switch (schedule.frequency) {
        case 'daily':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case 'weekly':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'monthly':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7);
      }
      
      // Lấy dữ liệu cảm biến
      const sensorData = await db.sensorData.findMany({
        where: {
          gardenId: schedule.gardenId,
          recordedAt: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { recordedAt: 'asc' }
      });
      
      // Lấy dữ liệu trạng thái thiết bị
      const deviceStatus = await db.deviceStatus.findMany({
        where: {
          gardenId: schedule.gardenId,
          updatedAt: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { updatedAt: 'asc' }
      });
      
      // Kiểm tra dữ liệu
      if (sensorData.length === 0) {
        logger.warn(`No sensor data found for garden ${schedule.gardenId} in the specified time range`);
        return;
      }
      
      // Tạo báo cáo đang xử lý
      const pendingReport = await db.aIReport.create({
        data: {
          gardenId: schedule.gardenId,
          reportType: schedule.reportType,
          result: {},
          analysisPeriodStart: startDate,
          analysisPeriodEnd: endDate,
          geminiModelVersion: 'gemini-pro',
          status: 'processing',
          reportFormat: 'PDF'
        }
      });
      
      // Phân tích dữ liệu
      try {
        const result = await analyzeGardenData({
          garden: schedule.garden,
          sensorData: sensorData.map(data => ({
            id: data.id,
            gardenId: data.gardenId,
            temperature: Number(data.temperature),
            humidity: Number(data.humidity),
            soilMoisture: Number(data.soilMoisture),
            lightLevel: Number(data.lightLevel),
            recordedAt: data.recordedAt
          })),
          deviceStatus,
          analysisType: schedule.reportType,
          startDate,
          endDate
        });
        
        // Cập nhật báo cáo
        const updatedReport = await db.aIReport.update({
          where: { id: pendingReport.id },
          data: {
            result,
            status: 'completed'
          }
        });
        
        // Tạo file PDF
        const filename = `report_${schedule.gardenId}_${schedule.reportType}_${new Date().getTime()}.pdf`;
        const pdfPath = await pdfService.generateReportPdf(
          {
            garden: schedule.garden,
            sensorData,
            deviceStatus,
            reportType: schedule.reportType,
            startDate,
            endDate,
            result
          },
          {
            title: `Báo cáo ${schedule.reportType} - ${schedule.garden.name}`,
            filename
          }
        );
        
        // Lưu đường dẫn PDF vào báo cáo
        await db.aIReport.update({
          where: { id: pendingReport.id },
          data: {
            pdfPath: path.basename(pdfPath)
          } as any
        });
        
        // Gửi email với file PDF đính kèm
        if (schedule.emailRecipients && schedule.emailRecipients.length > 0) {
          const emailSent = await emailService.sendReportEmail(
            schedule.emailRecipients,
            schedule.garden,
            schedule.reportType,
            pdfPath,
            startDate,
            endDate
          );
          
          if (emailSent) {
            logger.info(`Report email sent to ${schedule.emailRecipients.join(', ')}`);
          } else {
            logger.error(`Failed to send report email to ${schedule.emailRecipients.join(', ')}`);
          }
        }
        
        // Cập nhật thời gian gửi gần nhất
        await db.reportSchedule.update({
          where: { id: schedule.id },
          data: {
            lastSent: new Date()
          }
        });
        
        logger.info(`Successfully generated and sent scheduled report for garden ${schedule.gardenId}`);
      } catch (error) {
        // Cập nhật báo cáo lỗi
        await db.aIReport.update({
          where: { id: pendingReport.id },
          data: {
            result: { error: error instanceof Error ? error.message : 'Unknown error' },
            status: 'failed'
          }
        });
        
        logger.error(`Failed to generate scheduled report for garden ${schedule.gardenId}:`, error);
      }
    } catch (error) {
      logger.error(`Error in generateAndSendReport for schedule ${schedule.id}:`, error);
    }
  }
  
  /**
   * Tạo biểu thức cron từ lịch trình
   */
  private getCronExpression(schedule: any): string | null {
    try {
      // Lấy giờ và phút từ timeOfDay
      const time = new Date(schedule.timeOfDay);
      const hours = time.getHours();
      const minutes = time.getMinutes();
      
      // Tạo biểu thức cron dựa trên tần suất
      switch (schedule.frequency) {
        case 'daily':
          return `${minutes} ${hours} * * *`;
        
        case 'weekly':
          if (schedule.dayOfWeek === undefined || schedule.dayOfWeek < 0 || schedule.dayOfWeek > 6) {
            return null;
          }
          return `${minutes} ${hours} * * ${schedule.dayOfWeek}`;
        
        case 'monthly':
          // Chạy vào ngày đầu tiên của tháng
          return `${minutes} ${hours} 1 * *`;
        
        default:
          return null;
      }
    } catch (error) {
      logger.error(`Error creating cron expression for schedule ${schedule.id}:`, error);
      return null;
    }
  }
  
  /**
   * Thêm hoặc cập nhật lịch trình
   */
  async addOrUpdateSchedule(scheduleId: string) {
    try {
      const schedule = await db.reportSchedule.findUnique({
        where: { id: scheduleId },
        include: { garden: true }
      });
      
      if (!schedule) {
        logger.warn(`Schedule with ID ${scheduleId} not found`);
        return;
      }
      
      this.scheduleReport(schedule);
    } catch (error) {
      logger.error(`Failed to add or update schedule ${scheduleId}:`, error);
    }
  }
  
  /**
   * Xóa lịch trình
   */
  removeSchedule(scheduleId: string) {
    try {
      if (this.tasks.has(scheduleId)) {
        this.tasks.get(scheduleId)?.stop();
        this.tasks.delete(scheduleId);
        logger.info(`Removed schedule ${scheduleId}`);
      }
    } catch (error) {
      logger.error(`Failed to remove schedule ${scheduleId}:`, error);
    }
  }
}

export const schedulerService = new SchedulerService(); 