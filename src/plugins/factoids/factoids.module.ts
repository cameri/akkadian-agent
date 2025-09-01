import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '../../cache/cache.module';
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
import { NaturalLanguageService } from './services/natural-language.service';
import { PatternMatchingService } from './services/pattern-matching.service';

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
    CacheModule,
    MongooseModule.forFeature([
      { name: Factoid.name, schema: FactoidSchema },
      { name: FactPattern.name, schema: FactPatternSchema },
      { name: ChatKnowledge.name, schema: ChatKnowledgeSchema },
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

    // Command Handlers
    LearnFactCommandHandler,
    ProcessMessageCommandHandler,

    // Query Handlers
    FindFactQueryHandler,
    SearchFactsQueryHandler,
  ],
  controllers: [FactoidsController],
  exports: [FactoidsRepository, NaturalLanguageService, PatternMatchingService],
})
export class FactoidsModule {}
