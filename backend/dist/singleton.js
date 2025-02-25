"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prismaMock = exports.prisma = exports.createMockContext = void 0;
const client_1 = require("@prisma/client");
const jest_mock_extended_1 = require("jest-mock-extended");
const prisma = new client_1.PrismaClient();
exports.prisma = prisma;
const prismaMock = (0, jest_mock_extended_1.mockDeep)();
exports.prismaMock = prismaMock;
const createMockContext = () => {
    return {
        prisma: prismaMock,
    };
};
exports.createMockContext = createMockContext;
exports.default = prisma;
//# sourceMappingURL=singleton.js.map