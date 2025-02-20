import sequelize from '../config/database';
import { logger } from '../utils/logger';

async function cleanDatabase() {
  try {
    await sequelize.transaction(async (t) => {
      // Xóa dữ liệu theo thứ tự để tránh lỗi khóa ngoại
      await sequelize.query('TRUNCATE TABLE "SensorData" CASCADE', { transaction: t });
      await sequelize.query('TRUNCATE TABLE "sensor_data" CASCADE', { transaction: t });
      await sequelize.query('TRUNCATE TABLE "Alerts" CASCADE', { transaction: t });
      await sequelize.query('TRUNCATE TABLE "alerts" CASCADE', { transaction: t });
      await sequelize.query('TRUNCATE TABLE "advices" CASCADE', { transaction: t });
      await sequelize.query('TRUNCATE TABLE "advisors" CASCADE', { transaction: t });
      await sequelize.query('TRUNCATE TABLE "Devices" CASCADE', { transaction: t });
      await sequelize.query('TRUNCATE TABLE "devices" CASCADE', { transaction: t });
      await sequelize.query('TRUNCATE TABLE "settings" CASCADE', { transaction: t });
      await sequelize.query('TRUNCATE TABLE "Users" CASCADE', { transaction: t });
      await sequelize.query('TRUNCATE TABLE "users" CASCADE', { transaction: t });
      await sequelize.query('TRUNCATE TABLE "seeder_meta" CASCADE', { transaction: t });
    });

    logger.info('Đã xóa toàn bộ dữ liệu mẫu');
    process.exit(0);
  } catch (error) {
    logger.error('Lỗi khi xóa dữ liệu:', error);
    process.exit(1);
  }
}

cleanDatabase(); 