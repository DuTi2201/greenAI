import cron from 'node-cron';
import type { Schedule } from '../types';
import { db } from '../singleton';
import { controlDevice } from './device.service';
import { generateWeeklyReport, cleanupOldReports } from './ai.service';

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