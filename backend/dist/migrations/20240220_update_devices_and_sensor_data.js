"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const sequelize_1 = require("sequelize");
function up(queryInterface) {
    return __awaiter(this, void 0, void 0, function* () {
        // 1. Cập nhật enum device_type
        yield queryInterface.sequelize.query(`
    ALTER TYPE "enum_devices_type" ADD VALUE IF NOT EXISTS 'water_pump';
    ALTER TYPE "enum_devices_type" ADD VALUE IF NOT EXISTS 'nutrient_pump';
    ALTER TYPE "enum_devices_type" ADD VALUE IF NOT EXISTS 'wemos';
    ALTER TYPE "enum_devices_type" ADD VALUE IF NOT EXISTS 'arduino';
  `);
        // 2. Cập nhật enum device_status
        yield queryInterface.sequelize.query(`
    ALTER TYPE "enum_devices_status" ADD VALUE IF NOT EXISTS 'error';
    ALTER TYPE "enum_devices_status" ADD VALUE IF NOT EXISTS 'disconnected';
  `);
        // 3. Thêm indexes cho bảng devices
        yield queryInterface.addIndex('devices', ['type', 'status'], {
            name: 'devices_type_status_idx'
        });
        yield queryInterface.addIndex('devices', ['created_by'], {
            name: 'devices_created_by_idx'
        });
        // 4. Thêm các cột mới vào bảng sensor_data
        yield queryInterface.addColumn('sensor_data', 'water_pump_state', {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        });
        yield queryInterface.addColumn('sensor_data', 'nutrient_pump_state', {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        });
        // 5. Thêm indexes cho bảng sensor_data
        yield queryInterface.addIndex('sensor_data', ['timestamp'], {
            name: 'sensor_data_timestamp_idx'
        });
        yield queryInterface.addIndex('sensor_data', ['device_id', 'metadata'], {
            name: 'sensor_data_device_metadata_idx',
            using: 'gin',
            operator: 'jsonb_path_ops'
        });
        // 6. Thêm constraints cho các trường số liệu
        yield queryInterface.sequelize.query(`
    ALTER TABLE sensor_data ADD CONSTRAINT chk_temperature 
    CHECK (temperature >= -50 AND temperature <= 100);

    ALTER TABLE sensor_data ADD CONSTRAINT chk_humidity
    CHECK (humidity >= 0 AND humidity <= 100);

    ALTER TABLE sensor_data ADD CONSTRAINT chk_light
    CHECK (light >= 0 AND light <= 1023);

    ALTER TABLE sensor_data ADD CONSTRAINT chk_soil_moisture
    CHECK (soil_moisture >= 0 AND soil_moisture <= 1023);
  `);
    });
}
function down(queryInterface) {
    return __awaiter(this, void 0, void 0, function* () {
        // 1. Xóa constraints
        yield queryInterface.sequelize.query(`
    ALTER TABLE sensor_data DROP CONSTRAINT IF EXISTS chk_temperature;
    ALTER TABLE sensor_data DROP CONSTRAINT IF EXISTS chk_humidity;
    ALTER TABLE sensor_data DROP CONSTRAINT IF EXISTS chk_light;
    ALTER TABLE sensor_data DROP CONSTRAINT IF EXISTS chk_soil_moisture;
  `);
        // 2. Xóa indexes
        yield queryInterface.removeIndex('sensor_data', 'sensor_data_timestamp_idx');
        yield queryInterface.removeIndex('sensor_data', 'sensor_data_device_metadata_idx');
        yield queryInterface.removeIndex('devices', 'devices_type_status_idx');
        yield queryInterface.removeIndex('devices', 'devices_created_by_idx');
        // 3. Xóa các cột mới
        yield queryInterface.removeColumn('sensor_data', 'water_pump_state');
        yield queryInterface.removeColumn('sensor_data', 'nutrient_pump_state');
        // 4. Không thể xóa enum values trong PostgreSQL
        // Nếu cần, phải tạo enum mới và thay thế
    });
}
