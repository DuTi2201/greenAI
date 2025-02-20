"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Alert = exports.AlertStatus = exports.AlertSeverity = exports.AlertType = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = __importDefault(require("../config/sequelize"));
var AlertType;
(function (AlertType) {
    AlertType["ERROR"] = "error";
    AlertType["WARNING"] = "warning";
    AlertType["INFO"] = "info";
})(AlertType || (exports.AlertType = AlertType = {}));
var AlertSeverity;
(function (AlertSeverity) {
    AlertSeverity["HIGH"] = "high";
    AlertSeverity["MEDIUM"] = "medium";
    AlertSeverity["LOW"] = "low";
})(AlertSeverity || (exports.AlertSeverity = AlertSeverity = {}));
var AlertStatus;
(function (AlertStatus) {
    AlertStatus["ACTIVE"] = "active";
    AlertStatus["RESOLVED"] = "resolved";
})(AlertStatus || (exports.AlertStatus = AlertStatus = {}));
class Alert extends sequelize_1.Model {
}
exports.Alert = Alert;
Alert.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    type: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(AlertType)),
        allowNull: false,
    },
    message: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    severity: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(AlertSeverity)),
        allowNull: false,
    },
    deviceId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'devices',
            key: 'id',
        },
    },
    status: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(AlertStatus)),
        allowNull: false,
        defaultValue: AlertStatus.ACTIVE,
    },
    metadata: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
    },
    resolvedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    resolvedBy: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id',
        },
    },
}, {
    sequelize: sequelize_2.default,
    modelName: 'Alert',
    tableName: 'alerts',
    timestamps: true,
    paranoid: true,
    underscored: true,
});
exports.default = Alert;
