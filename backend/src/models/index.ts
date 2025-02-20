import sequelize from '../config/sequelize';
import { Device } from './Device';
import { SensorData } from './SensorData';
import { Alert } from './Alert';
import { User } from './User';
import { Advisor } from './Advisor';
import { Advice } from './Advice';

// Khởi tạo các model
Advisor.initModel(sequelize);
Advice.initModel(sequelize);

// Thiết lập các mối quan hệ
Device.hasMany(SensorData, { 
  foreignKey: 'deviceId',
  onDelete: 'CASCADE'
});
SensorData.belongsTo(Device, { foreignKey: 'deviceId' });

Device.hasMany(Alert, { 
  foreignKey: 'deviceId',
  onDelete: 'CASCADE'
});
Alert.belongsTo(Device, { foreignKey: 'deviceId' });

// Thêm quan hệ với User
Device.belongsTo(User, { 
  foreignKey: 'createdBy',
  as: 'creator'
});

Alert.belongsTo(User, {
  foreignKey: 'resolvedBy',
  as: 'resolver'
});

// Thêm quan hệ cho Advisor và Advice
Advisor.belongsTo(User, { foreignKey: 'userId' });
Advisor.hasMany(Advice, { 
  foreignKey: 'advisorId',
  onDelete: 'CASCADE'
});

Advice.belongsTo(Advisor, { foreignKey: 'advisorId' });
Advice.belongsTo(Device, { foreignKey: 'deviceId' });

export { Device, SensorData, Alert, User, Advisor, Advice };
export { sequelize };
export default {
  Device,
  SensorData,
  Alert,
  User,
  Advisor,
  Advice,
  sequelize
}; 