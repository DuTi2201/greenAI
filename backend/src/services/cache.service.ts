import { logger } from '../utils/logger';

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

export class CacheService {
  private static instance: CacheService;
  private cache: Map<string, CacheItem<any>>;
  private readonly DEFAULT_TTL = 5000; // 5 giây

  private constructor() {
    this.cache = new Map();
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  // Lưu dữ liệu vào cache
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now() + ttl
    });
    logger.debug(`Cache set: ${key}`);
  }

  // Lấy dữ liệu từ cache
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      logger.debug(`Cache miss: ${key}`);
      return null;
    }

    if (Date.now() > item.timestamp) {
      logger.debug(`Cache expired: ${key}`);
      this.cache.delete(key);
      return null;
    }

    logger.debug(`Cache hit: ${key}`);
    return item.data as T;
  }

  // Xóa một key khỏi cache
  delete(key: string): void {
    this.cache.delete(key);
    logger.debug(`Cache deleted: ${key}`);
  }

  // Xóa toàn bộ cache
  clear(): void {
    this.cache.clear();
    logger.debug('Cache cleared');
  }

  // Làm mới TTL cho một key
  refresh(key: string, ttl: number = this.DEFAULT_TTL): void {
    const item = this.cache.get(key);
    if (item) {
      item.timestamp = Date.now() + ttl;
      logger.debug(`Cache refreshed: ${key}`);
    }
  }
} 