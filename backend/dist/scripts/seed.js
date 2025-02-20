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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const umzug_1 = require("umzug");
const sequelize_1 = __importDefault(require("../config/sequelize"));
const logger_1 = require("../utils/logger");
const umzug = new umzug_1.Umzug({
    migrations: {
        glob: 'src/seeders/*.ts',
        resolve: ({ name, path, context }) => {
            const seeder = require(path);
            return {
                name,
                up: () => __awaiter(void 0, void 0, void 0, function* () { return seeder.up(context, sequelize_1.default); }),
                down: () => __awaiter(void 0, void 0, void 0, function* () { return seeder.down(context, sequelize_1.default); }),
            };
        },
    },
    context: sequelize_1.default.getQueryInterface(),
    storage: new umzug_1.SequelizeStorage({
        sequelize: sequelize_1.default,
        modelName: 'seeder_meta' // Tách riêng bảng lưu trạng thái seeder
    }),
    logger: console,
});
function seed() {
    return __awaiter(this, void 0, void 0, function* () {
        const command = process.argv[2];
        try {
            if (command === 'undo') {
                yield umzug.down();
                logger_1.logger.info('Successfully reverted last seeder');
            }
            else {
                yield umzug.up();
                logger_1.logger.info('Successfully ran all pending seeders');
            }
            process.exit(0);
        }
        catch (error) {
            logger_1.logger.error('Error running seeders:', error);
            process.exit(1);
        }
    });
}
seed();
