import { Injectable, Logger } from '@nestjs/common';
import { CACHE_TTL_SECONDS } from '../cache.constants';
import type { ICacheService } from '../cache.types';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

@Injectable()
export class CacheService implements ICacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private readonly cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 300000);
  }

  get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) {
      return Promise.resolve(null);
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return Promise.resolve(null);
    }

    return Promise.resolve(entry.value);
  }

  set<T>(key: string, value: T, ttlSeconds = CACHE_TTL_SECONDS): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, {
      value,
      expiresAt,
    });

    this.logger.debug(`Cached value for key: ${key} (TTL: ${ttlSeconds}s)`);
    return Promise.resolve();
  }

  delete(key: string): Promise<void> {
    this.cache.delete(key);
    this.logger.debug(`Deleted cache key: ${key}`);
    return Promise.resolve();
  }

  clear(pattern?: string): Promise<void> {
    if (!pattern) {
      this.cache.clear();
      this.logger.debug('Cleared entire cache');
      return Promise.resolve();
    }

    const regex = new RegExp(pattern);
    const keysToDelete = Array.from(this.cache.keys()).filter((key) =>
      regex.test(key),
    );

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }

    this.logger.debug(
      `Cleared ${keysToDelete.length} cache entries matching pattern: ${pattern}`,
    );
    return Promise.resolve();
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.cache.delete(key);
    }

    if (expiredKeys.length > 0) {
      this.logger.debug(
        `Cleaned up ${expiredKeys.length} expired cache entries`,
      );
    }
  }

  onModuleDestroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}
