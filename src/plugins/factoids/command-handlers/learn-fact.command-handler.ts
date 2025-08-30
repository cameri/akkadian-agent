import { Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LearnFactCommand } from '../commands/learn-fact.command';
import {
  FACT_CACHE_PREFIX,
  MAX_FACTS_PER_CHAT,
  RESPONSE_TEMPLATES,
} from '../factoids.constants';
import type { LearnFactCommandResult } from '../factoids.types';
import { ChatKnowledgeRepository } from '../repositories/chat-knowledge.repository';
import { FactoidsRepository } from '../repositories/factoids.repository';
import { CacheService } from '../services/cache.service';
import { NaturalLanguageService } from '../services/natural-language.service';

@CommandHandler(LearnFactCommand)
export class LearnFactCommandHandler
  implements ICommandHandler<LearnFactCommand, LearnFactCommandResult>
{
  private readonly logger = new Logger(LearnFactCommandHandler.name);

  constructor(
    private readonly factoidsRepository: FactoidsRepository,
    private readonly chatKnowledgeRepository: ChatKnowledgeRepository,
    private readonly naturalLanguageService: NaturalLanguageService,
    private readonly cacheService: CacheService,
  ) {}

  async execute(command: LearnFactCommand): Promise<LearnFactCommandResult> {
    try {
      this.logger.debug(
        `Processing learn fact command for chat ${command.chatId}: ${command.text}`,
      );

      // Check if learning is enabled for this chat
      const chatKnowledge = await this.chatKnowledgeRepository.findByChatId(
        command.chatId,
      );

      if (
        chatKnowledge?.settings?.learningEnabled === false ||
        (chatKnowledge?.factCount || 0) >= MAX_FACTS_PER_CHAT
      ) {
        return {
          success: false,
          error: 'Fact learning is disabled or limit reached for this chat',
        };
      }

      // Extract fact from text
      const extractedFact = await this.naturalLanguageService.extractFact(
        command.text,
      );

      if (!extractedFact) {
        return {
          success: false,
          message: RESPONSE_TEMPLATES.PARSING_ERROR,
        };
      }

      // Check if fact already exists
      const existingFactoid = await this.factoidsRepository.findBySubject(
        command.chatId,
        extractedFact.subject,
      );

      // Create or update factoid
      const factoid = await this.factoidsRepository.create({
        chatId: command.chatId,
        subject: extractedFact.subject,
        predicate: extractedFact.predicate,
        confidence: extractedFact.confidence,
        userId: command.userId,
        username: command.username,
      });

      // Update chat knowledge
      if (!existingFactoid) {
        await this.chatKnowledgeRepository.incrementFactCount(command.chatId);
      }

      // Cache the new fact
      const cacheKey = `${FACT_CACHE_PREFIX}${command.chatId}:${extractedFact.subject}`;
      await this.cacheService.set(cacheKey, factoid);

      const responseMessage = existingFactoid
        ? RESPONSE_TEMPLATES.FACT_UPDATED.replaceAll(
            '{subject}',
            extractedFact.subject,
          )
        : RESPONSE_TEMPLATES.FACT_LEARNED.replaceAll(
            '{subject}',
            extractedFact.subject,
          ).replaceAll('{predicate}', extractedFact.predicate);

      this.logger.log(
        `Successfully learned fact: ${extractedFact.subject} -> ${extractedFact.predicate}`,
      );

      return {
        success: true,
        factoid,
        message: responseMessage,
      };
    } catch (error) {
      this.logger.error(`Error learning fact: ${error}`, error);
      return {
        success: false,
        error: RESPONSE_TEMPLATES.STORAGE_ERROR,
      };
    }
  }
}
