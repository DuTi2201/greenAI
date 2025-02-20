import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  // 1. Cập nhật enum device_type
  await queryInterface.sequelize.query(`
    ALTER TYPE "enum_devices_type" ADD VALUE IF NOT EXISTS 'water_pump';
    ALTER TYPE "enum_devices_type" ADD VALUE IF NOT EXISTS 'nutrient_pump';
    ALTER TYPE "enum_devices_type" ADD VALUE IF NOT EXISTS 'wemos';
    ALTER TYPE "enum_devices_type" ADD VALUE IF NOT EXISTS 'arduino';
  `);

  // 2. Cập nhật enum device_status
  await queryInterface.sequelize.query(`
    ALTER TYPE "enum_devices_status" ADD VALUE IF NOT EXISTS 'error';
    ALTER TYPE "enum_devices_status" ADD VALUE IF NOT EXISTS 'disconnected';
  `);

  // 3. Thêm indexes cho bảng devices
  await queryInterface.addIndex('devices', ['type', 'status'], {
    name: 'devices_type_status_idx'
  });

  await queryInterface.addIndex('devices', ['created_by'], {
    name: 'devices_created_by_idx'
  });

  // 4. Thêm các cột mới vào bảng sensor_data
  await queryInterface.addColumn('sensor_data', 'water_pump_state', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  });

  await queryInterface.addColumn('sensor_data', 'nutrient_pump_state', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  });

  // 5. Thêm indexes cho bảng sensor_data
  await queryInterface.addIndex('sensor_data', ['timestamp'], {
    name: 'sensor_data_timestamp_idx'
  });

  await queryInterface.addIndex('sensor_data', ['device_id', 'metadata'], {
    name: 'sensor_data_device_metadata_idx',
    using: 'gin',
    operator: 'jsonb_path_ops'
  });

  // 6. Thêm constraints cho các trường số liệu
  await queryInterface.sequelize.query(`
    ALTER TABLE sensor_data ADD CONSTRAINT chk_temperature 
    CHECK (temperature >= -50 AND temperature <= 100);

    ALTER TABLE sensor_data ADD CONSTRAINT chk_humidity
    CHECK (humidity >= 0 AND humidity <= 100);

    ALTER TABLE sensor_data ADD CONSTRAINT chk_light
    CHECK (light >= 0 AND light <= 1023);

    ALTER TABLE sensor_data ADD CONSTRAINT chk_soil_moisture
    CHECK (soil_moisture >= 0 AND soil_moisture <= 1023);
  `);
}

export async function down(queryInterface: QueryInterface) {
  // 1. Xóa constraints
  await queryInterface.sequelize.query(`
    ALTER TABLE sensor_data DROP CONSTRAINT IF EXISTS chk_temperature;
    ALTER TABLE sensor_data DROP CONSTRAINT IF EXISTS chk_humidity;
    ALTER TABLE sensor_data DROP CONSTRAINT IF EXISTS chk_light;
    ALTER TABLE sensor_data DROP CONSTRAINT IF EXISTS chk_soil_moisture;
  `);

  // 2. Xóa indexes
  await queryInterface.removeIndex('sensor_data', 'sensor_data_timestamp_idx');
  await queryInterface.removeIndex('sensor_data', 'sensor_data_device_metadata_idx');
  await queryInterface.removeIndex('devices', 'devices_type_status_idx');
  await queryInterface.removeIndex('devices', 'devices_created_by_idx');

  // 3. Xóa các cột mới
  await queryInterface.removeColumn('sensor_data', 'water_pump_state');
  await queryInterface.removeColumn('sensor_data', 'nutrient_pump_state');

  // 4. Không thể xóa enum values trong PostgreSQL
  // Nếu cần, phải tạo enum mới và thay thế
} 