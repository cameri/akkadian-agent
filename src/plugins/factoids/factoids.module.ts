import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy, ClientsModule, Transport } from '@nestjs/microservices';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseModule } from '../../database/database.module';
import { InstrumentationModule } from '../../instrumentation/instrumentation.module';

// Schemas
import {
  ChatKnowledge,
  ChatKnowledgeSchema,
} from './schemas/chat-knowledge.schema';
import { FactPattern, FactPatternSchema } from './schemas/fact-pattern.schema';
import { Factoid, FactoidSchema } from './schemas/factoid.schema';

// Repositories
import { ChatKnowledgeRepository } from './repositories/chat-knowledge.repository';
import { FactPatternsRepository } from './repositories/fact-patterns.repository';
import { FactoidsRepository } from './repositories/factoids.repository';

// Services
import type { ICacheService } from './factoids.types';
import { CacheService } from './services/cache.service';
import { NaturalLanguageService } from './services/natural-language.service';
import { PatternMatchingService } from './services/pattern-matching.service';
import { RedisCacheService } from './services/redis-cache.service';

// Command Handlers
import { LearnFactCommandHandler } from './command-handlers/learn-fact.command-handler';
import { ProcessMessageCommandHandler } from './command-handlers/process-message.command-handler';

// Query Handlers
import { FindFactQueryHandler } from './query-handlers/find-fact.query-handler';
import { SearchFactsQueryHandler } from './query-handlers/search-facts.query-handler';

// Controller
import { FactoidsController } from './factoids.controller';

@Module({
  imports: [
    InstrumentationModule,
    DatabaseModule,
    MongooseModule.forFeature([
      { name: Factoid.name, schema: FactoidSchema },
      { name: FactPattern.name, schema: FactPatternSchema },
      { name: ChatKnowledge.name, schema: ChatKnowledgeSchema },
    ]),
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
            `Connecting to Redis at ${redisHost}:${redisPort}, DB: ${redisDb}`,
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
    // Repositories
    FactoidsRepository,
    FactPatternsRepository,
    ChatKnowledgeRepository,

    // Services
    NaturalLanguageService,
    PatternMatchingService,
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
          console.log('using RedisCacheService');
          return new RedisCacheService(redisClient);
        }

        console.log('using CacheService');
        return new CacheService();
      },
    },

    // Command Handlers
    LearnFactCommandHandler,
    ProcessMessageCommandHandler,

    // Query Handlers
    FindFactQueryHandler,
    SearchFactsQueryHandler,
  ],
  controllers: [FactoidsController],
  exports: [
    FactoidsRepository,
    NaturalLanguageService,
    PatternMatchingService,
    CacheService,
  ],
})
export class FactoidsModule {}
