"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupBullQueues = exports.reportQueue = void 0;
const bull_1 = __importDefault(require("bull"));
const ai_1 = require("./ai");
const email_1 = require("./email");
const server_1 = require("../server");
exports.reportQueue = new bull_1.default('report-generation', process.env.REDIS_URL || 'redis://localhost:6379');
const setupBullQueues = () => {
    exports.reportQueue.process('generate-report', async (job) => {
        try {
            const { deviceId, reportType, startDate, endDate, userId } = job.data;
            const analysis = await (0, ai_1.generateAIReport)({
                deviceId,
                reportType,
                startDate,
                endDate
            });
            const user = await server_1.prisma.user.findUnique({
                where: { id: userId },
                select: { email: true }
            });
            if (!user) {
                throw new Error('User not found');
            }
            const device = await server_1.prisma.garden.findUnique({
                where: { id: deviceId },
                select: { name: true }
            });
            if (!device) {
                throw new Error('Device not found');
            }
            await (0, email_1.sendEmail)({
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
        }
        catch (error) {
            console.error('Error processing report generation job:', error);
            throw error;
        }
    });
    exports.reportQueue.on('failed', (job, err) => {
        console.error('Report generation job failed:', {
            jobId: job.id,
            data: job.data,
            error: err.message
        });
    });
    exports.reportQueue.on('completed', async (job) => {
        await job.remove();
    });
};
exports.setupBullQueues = setupBullQueues;
//# sourceMappingURL=queue.js.map