"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const logger_1 = require("../utils/logger");
class CacheService {
    constructor() {
        this.DEFAULT_TTL = 5000; // 5 giây
        this.cache = new Map();
    }
    static getInstance() {
        if (!CacheService.instance) {
            CacheService.instance = new CacheService();
        }
        return CacheService.instance;
    }
    // Lưu dữ liệu vào cache
    set(key, data, ttl = this.DEFAULT_TTL) {
        this.cache.set(key, {
            data,
            timestamp: Date.now() + ttl
        });
        logger_1.logger.debug(`Cache set: ${key}`);
    }
    // Lấy dữ liệu từ cache
    get(key) {
        const item = this.cache.get(key);
        if (!item) {
            logger_1.logger.debug(`Cache miss: ${key}`);
            return null;
        }
        if (Date.now() > item.timestamp) {
            logger_1.logger.debug(`Cache expired: ${key}`);
            this.cache.delete(key);
            return null;
        }
        logger_1.logger.debug(`Cache hit: ${key}`);
        return item.data;
    }
    // Xóa một key khỏi cache
    delete(key) {
        this.cache.delete(key);
        logger_1.logger.debug(`Cache deleted: ${key}`);
    }
    // Xóa toàn bộ cache
    clear() {
        this.cache.clear();
        logger_1.logger.debug('Cache cleared');
    }
    // Làm mới TTL cho một key
    refresh(key, ttl = this.DEFAULT_TTL) {
        const item = this.cache.get(key);
        if (item) {
            item.timestamp = Date.now() + ttl;
            logger_1.logger.debug(`Cache refreshed: ${key}`);
        }
    }
}
exports.CacheService = CacheService;
