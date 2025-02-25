import cron from 'node-cron';

/**
 * Kiểm tra chuỗi cron expression có hợp lệ không
 * @param expression Chuỗi cron expression cần kiểm tra
 * @returns true nếu hợp lệ, false nếu không hợp lệ
 */
export const validateCronExpression = (expression: string): boolean => {
  return cron.validate(expression);
}; 