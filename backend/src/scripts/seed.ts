import { Umzug, SequelizeStorage } from 'umzug';
import sequelize from '../config/sequelize';
import { logger } from '../utils/logger';

const umzug = new Umzug({
  migrations: {
    glob: 'src/seeders/*.ts',
    resolve: ({ name, path, context }) => {
      const seeder = require(path!);
      return {
        name,
        up: async () => seeder.up(context, sequelize),
        down: async () => seeder.down(context, sequelize),
      };
    },
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ 
    sequelize,
    modelName: 'seeder_meta' // Tách riêng bảng lưu trạng thái seeder
  }),
  logger: console,
});

async function seed() {
  const command = process.argv[2];

  try {
    if (command === 'undo') {
      await umzug.down();
      logger.info('Successfully reverted last seeder');
    } else {
      await umzug.up();
      logger.info('Successfully ran all pending seeders');
    }
    process.exit(0);
  } catch (error) {
    logger.error('Error running seeders:', error);
    process.exit(1);
  }
}

seed(); 