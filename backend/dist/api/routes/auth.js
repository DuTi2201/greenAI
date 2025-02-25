"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const singleton_1 = require("../../singleton");
const auth_1 = require("../../middleware/auth");
const error_1 = require("../../middleware/error");
exports.router = (0, express_1.Router)();
exports.router.post('/register', async (req, res, next) => {
    try {
        const { email, password, fullName, preferredLanguage, themePreference } = req.body;
        const existingUser = await singleton_1.prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            return next(new error_1.AppError('Email already exists', 400));
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const user = await singleton_1.prisma.user.create({
            data: {
                email,
                passwordHash,
                fullName,
                preferredLanguage,
                themePreference
            }
        });
        const token = jsonwebtoken_1.default.sign({ id: user.id }, process.env.JWT_SECRET || 'test-secret');
        res.status(201).json({
            status: 'success',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.fullName,
                    preferredLanguage: user.preferredLanguage,
                    themePreference: user.themePreference
                },
                token
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await singleton_1.prisma.user.findUnique({
            where: { email }
        });
        if (!user || !(await bcryptjs_1.default.compare(password, user.passwordHash))) {
            return next(new error_1.AppError('Invalid email or password', 401));
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id }, process.env.JWT_SECRET || 'test-secret');
        res.json({
            status: 'success',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.fullName,
                    preferredLanguage: user.preferredLanguage,
                    themePreference: user.themePreference
                },
                token
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.router.patch('/settings', auth_1.protect, async (req, res, next) => {
    try {
        const { preferredLanguage, themePreference } = req.body;
        const updatedUser = await singleton_1.prisma.user.update({
            where: { id: req.user.id },
            data: {
                preferredLanguage,
                themePreference
            }
        });
        res.json({
            status: 'success',
            data: {
                user: {
                    id: updatedUser.id,
                    email: updatedUser.email,
                    fullName: updatedUser.fullName,
                    preferredLanguage: updatedUser.preferredLanguage,
                    themePreference: updatedUser.themePreference
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = exports.router;
//# sourceMappingURL=auth.js.map