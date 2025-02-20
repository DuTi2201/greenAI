"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Advisor = void 0;
const sequelize_1 = require("sequelize");
const User_1 = require("./User");
class Advisor extends sequelize_1.Model {
    static initModel(sequelize) {
        return this.init({
            id: {
                type: sequelize_1.DataTypes.UUID,
                defaultValue: sequelize_1.DataTypes.UUIDV4,
                primaryKey: true,
            },
            timestamp: {
                type: sequelize_1.DataTypes.DATE,
                defaultValue: sequelize_1.DataTypes.NOW,
            },
            sensorData: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: false,
                defaultValue: {},
            },
            healthScore: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                validate: {
                    min: 0,
                    max: 100,
                },
            },
            recommendations: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: true,
                defaultValue: [],
            },
            analysis: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: false,
            },
            userId: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: false,
                references: {
                    model: User_1.User,
                    key: 'id',
                },
                field: 'user_id'
            },
        }, {
            sequelize,
            tableName: 'advisors',
            timestamps: true,
            underscored: true,
            indexes: [
                {
                    fields: ['user_id', 'timestamp'],
                },
            ],
        });
    }
    // Associations
    static associate(models) {
        this.belongsTo(models.User, { foreignKey: 'userId' });
    }
}
exports.Advisor = Advisor;
