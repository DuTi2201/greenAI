import Queue from 'bull';
import { generateAIReport } from './ai';
import { sendEmail } from './email';
import { prisma } from '../server';

interface ReportGenerationJob {
  deviceId: string;
  reportType: string;
  startDate: string;
  endDate: string;
  userId: string;
}

export const reportQueue = new Queue<ReportGenerationJob>('report-generation', process.env.REDIS_URL || 'redis://localhost:6379');

export const setupBullQueues = () => {
  // Process report generation jobs
  reportQueue.process('generate-report', async (job) => {
    try {
      const { deviceId, reportType, startDate, endDate, userId } = job.data;

      // Generate report
      const analysis = await generateAIReport({
        deviceId,
        reportType,
        startDate,
        endDate
      });

      // Get user email
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Get device name
      const device = await prisma.garden.findUnique({
        where: { id: deviceId },
        select: { name: true }
      });

      if (!device) {
        throw new Error('Device not found');
      }

      // Send email with report
      await sendEmail({
        to: user.email,
        subject: `Garden Report: ${device.name} - ${reportType}`,
        html: `
          <h1>Garden Analysis Report</h1>
          <p><strong>Device:</strong> ${device.name}</p>
          <p><strong>Period:</strong> ${startDate} to ${endDate}</p>
          <p><strong>Type:</strong> ${reportType}</p>
          <hr>
          <div style="white-space: pre-wrap;">${analysis}</div>
        `
      });

      return { success: true };
    } catch (error) {
      console.error('Error processing report generation job:', error);
      throw error;
    }
  });

  // Handle failed jobs
  reportQueue.on('failed', (job, err) => {
    console.error('Report generation job failed:', {
      jobId: job.id,
      data: job.data,
      error: err.message
    });
  });

  // Clean up completed jobs
  reportQueue.on('completed', async (job) => {
    await job.remove();
  });
}; 