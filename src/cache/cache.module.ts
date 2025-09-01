import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy, ClientsModule, Transport } from '@nestjs/microservices';
import type { ICacheService } from './cache.types';
import { CacheService } from './services/cache.service';
import { RedisCacheService } from './services/redis-cache.service';

@Module({
  imports: [
    // Conditionally register Redis client
    ClientsModule.registerAsync([
      {
        name: 'REDIS_CLIENT',
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
          const redisHost = configService.get<string>('REDIS_HOST');
          const redisPort = configService.get<number>('REDIS_PORT', 6379);
          const redisDb = configService.get<number>('REDIS_DB', 0);

          console.log(
            `Cache Module: Connecting to Redis at ${redisHost}:${redisPort}, DB: ${redisDb}`,
          );

          return {
            transport: Transport.REDIS,
            options: {
              host: redisHost,
              port: redisPort,
              db: redisDb,
              retryAttempts: 5,
              retryDelay: 3000,
            },
          };
        },
      },
    ]),
  ],
  providers: [
    // Conditionally provide Redis or in-memory cache
    {
      provide: CacheService,
      inject: [ConfigService, 'REDIS_CLIENT'],
      useFactory: (
        configService: ConfigService,
        redisClient?: ClientProxy,
      ): ICacheService => {
        const redisHost = configService.get<string>('REDIS_HOST');
        if (redisHost && redisClient) {
          console.log('Cache Module: Using RedisCacheService');
          return new RedisCacheService(redisClient);
        }
        console.log('Cache Module: Using in-memory CacheService');
        return new CacheService();
      },
    },
  ],
  exports: [CacheService],
})
export class CacheModule {}
