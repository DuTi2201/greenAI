"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockPrisma = exports.prismaMock = void 0;
const client_1 = require("@prisma/client");
const jest_mock_extended_1 = require("jest-mock-extended");
jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn()
}));
exports.prismaMock = (0, jest_mock_extended_1.mockDeep)();
beforeEach(() => {
    (0, jest_mock_extended_1.mockReset)(exports.prismaMock);
});
exports.mockPrisma = client_1.PrismaClient;
exports.mockPrisma.mockReturnValue(exports.prismaMock);
//# sourceMappingURL=setup.js.map