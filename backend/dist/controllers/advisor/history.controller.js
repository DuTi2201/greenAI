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
exports.getAdvisorHistory = void 0;
const Advisor_1 = require("../../models/Advisor");
const getAdvisorHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const history = yield Advisor_1.Advisor.findAll({
            where: { userId },
            order: [['timestamp', 'DESC']],
            limit: 20, // Giới hạn 20 bản ghi gần nhất
        });
        res.json(history);
    }
    catch (error) {
        console.error('Error getting advisor history:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getAdvisorHistory = getAdvisorHistory;
