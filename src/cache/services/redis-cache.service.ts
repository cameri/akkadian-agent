import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, of, timeout } from 'rxjs';
import { CACHE_TTL_SECONDS } from '../cache.constants';
import type { ICacheService } from '../cache.types';

@Injectable()
export class RedisCacheService implements ICacheService, OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private readonly operationTimeoutMs = 5000; // 5 second timeout for Redis operations

  constructor(
    @Inject('REDIS_CLIENT') private readonly redisClient: ClientProxy,
  ) {}

  async onModuleDestroy(): Promise<void> {
    try {
      await this.redisClient.close();
    } catch (error) {
      this.logger.error('Error closing Redis client connection', error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const result = await firstValueFrom(
        this.redisClient.send<string | null>('get', key).pipe(
          timeout(this.operationTimeoutMs),
          catchError((error: Error) => {
            this.logger.warn(
              `Failed to get cache key "${key}": ${error.message}`,
            );
            return of(null);
          }),
        ),
      );

      if (result === null) {
        return null;
      }

      try {
        return JSON.parse(result) as T;
      } catch (parseError) {
        this.logger.warn(
          `Failed to parse cached value for key "${key}": ${parseError.message}`,
        );
        // Clean up corrupted data
        await this.delete(key);
        return null;
      }
    } catch (error) {
      this.logger.error(
        `Redis get operation failed for key "${key}": ${error.message}`,
      );
      return null;
    }
  }

  async set<T>(
    key: string,
    value: T,
    ttlSeconds = CACHE_TTL_SECONDS,
  ): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      await firstValueFrom(
        this.redisClient
          .send('setex', { key, seconds: ttlSeconds, value: serializedValue })
          .pipe(
            timeout(this.operationTimeoutMs),
            catchError((error) => {
              this.logger.warn(
                `Failed to set cache key "${key}": ${error.message}`,
              );
              throw error;
            }),
          ),
      );

      this.logger.debug(`Cached value for key: ${key} (TTL: ${ttlSeconds}s)`);
    } catch (error) {
      this.logger.error(
        `Redis set operation failed for key "${key}": ${error.message}`,
      );
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await firstValueFrom(
        this.redisClient.send('del', key).pipe(
          timeout(this.operationTimeoutMs),
          catchError((error) => {
            this.logger.warn(
              `Failed to delete cache key "${key}": ${error.message}`,
            );
            return of(0);
          }),
        ),
      );

      this.logger.debug(`Deleted cache key: ${key}`);
    } catch (error) {
      this.logger.error(
        `Redis delete operation failed for key "${key}": ${error.message}`,
      );
      // Don't throw on delete failures to avoid breaking application flow
    }
  }

  async clear(pattern?: string): Promise<void> {
    try {
      if (!pattern) {
        // Clear all keys - use FLUSHDB for the current database
        await firstValueFrom(
          this.redisClient.send('flushdb', {}).pipe(
            timeout(this.operationTimeoutMs),
            catchError((error) => {
              this.logger.warn(`Failed to clear all cache: ${error.message}`);
              throw error;
            }),
          ),
        );
        this.logger.debug('Cleared entire cache');
      } else {
        // Use SCAN to find keys matching the pattern, then delete them
        await this.clearByPattern(pattern);
        this.logger.debug(`Cleared cache entries matching pattern: ${pattern}`);
      }
    } catch (error) {
      this.logger.error(
        `Redis clear operation failed${pattern ? ` for pattern "${pattern}"` : ''}: ${error.message}`,
      );
      throw error;
    }
  }

  private async clearByPattern(pattern: string): Promise<void> {
    let cursor = '0';
    const keysToDelete: string[] = [];

    do {
      try {
        const scanResult = await firstValueFrom(
          this.redisClient
            .send<[string, string[]]>('scan', {
              cursor,
              match: pattern,
              count: 100,
            })
            .pipe(
              timeout(this.operationTimeoutMs),
              catchError((error) => {
                this.logger.warn(
                  `Failed to scan keys with pattern "${pattern}": ${error.message}`,
                );
                throw error;
              }),
            ),
        );

        cursor = scanResult[0];
        const matchingKeys = scanResult[1];
        keysToDelete.push(...matchingKeys);
      } catch (error) {
        this.logger.error(`Error during pattern scan: ${error.message}`);
        throw error;
      }
    } while (cursor !== '0');

    // Delete keys in batches to avoid overwhelming Redis
    const batchSize = 100;
    for (let i = 0; i < keysToDelete.length; i += batchSize) {
      const batch = keysToDelete.slice(i, i + batchSize);
      if (batch.length > 0) {
        try {
          await firstValueFrom(
            this.redisClient.send('del', batch).pipe(
              timeout(this.operationTimeoutMs),
              catchError((error) => {
                this.logger.warn(
                  `Failed to delete batch of keys: ${error.message}`,
                );
                return of(0);
              }),
            ),
          );
        } catch (error) {
          this.logger.warn(`Error deleting batch of keys: ${error.message}`);
          // Continue with next batch even if this one fails
        }
      }
    }
  }
}
