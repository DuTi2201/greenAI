import { Sequelize } from 'sequelize';
import { logger } from '../utils/logger';

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'greenai',
  logging: (msg) => logger.debug(msg)
});

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Đã kết nối thành công đến database.');
  } catch (error) {
    logger.error('Không thể kết nối đến database:', error);
    throw error;
  }
};

export default sequelize; 