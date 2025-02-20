"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Advice = exports.AdviceStatus = void 0;
const sequelize_1 = require("sequelize");
const Device_1 = require("./Device");
const Advisor_1 = require("./Advisor");
var AdviceStatus;
(function (AdviceStatus) {
    AdviceStatus["PENDING"] = "pending";
    AdviceStatus["APPLIED"] = "applied";
    AdviceStatus["REJECTED"] = "rejected";
})(AdviceStatus || (exports.AdviceStatus = AdviceStatus = {}));
class Advice extends sequelize_1.Model {
    static initModel(sequelize) {
        return this.init({
            id: {
                type: sequelize_1.DataTypes.UUID,
                defaultValue: sequelize_1.DataTypes.UUIDV4,
                primaryKey: true,
            },
            advisorId: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: false,
                references: {
                    model: Advisor_1.Advisor,
                    key: 'id',
                },
                field: 'advisor_id'
            },
            deviceId: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: false,
                references: {
                    model: Device_1.Device,
                    key: 'id',
                },
                field: 'device_id'
            },
            title: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
            },
            description: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: false,
            },
            action: {
                type: sequelize_1.DataTypes.ENUM('on', 'off'),
                allowNull: false,
            },
            duration: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
            },
            status: {
                type: sequelize_1.DataTypes.ENUM(...Object.values(AdviceStatus)),
                allowNull: false,
                defaultValue: AdviceStatus.PENDING,
            },
            appliedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                field: 'applied_at'
            },
            success: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: true,
            },
        }, {
            sequelize,
            modelName: 'Advice',
            tableName: 'advices',
            timestamps: true,
            underscored: true,
            indexes: [
                {
                    fields: ['advisor_id'],
                },
                {
                    fields: ['device_id'],
                },
                {
                    fields: ['status'],
                },
            ],
        });
    }
}
exports.Advice = Advice;
