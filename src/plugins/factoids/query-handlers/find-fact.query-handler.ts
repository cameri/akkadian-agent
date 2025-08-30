import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { FindFactQuery } from '../queries/find-fact.query';
import type { FindFactQueryResult, IFactoid } from '../factoids.types';
import { FactoidsRepository } from '../repositories/factoids.repository';
import { NaturalLanguageService } from '../services/natural-language.service';
import { CacheService } from '../services/cache.service';
import {
  FACT_CACHE_PREFIX,
  SimilarityAlgorithm,
  QUERY_TIMEOUT_MS,
} from '../factoids.constants';

@QueryHandler(FindFactQuery)
export class FindFactQueryHandler
  implements IQueryHandler<FindFactQuery, FindFactQueryResult>
{
  private readonly logger = new Logger(FindFactQueryHandler.name);

  constructor(
    private readonly factoidsRepository: FactoidsRepository,
    private readonly naturalLanguageService: NaturalLanguageService,
    private readonly cacheService: CacheService,
  ) {}

  async execute(query: FindFactQuery): Promise<FindFactQueryResult> {
    try {
      const startTime = Date.now();

      // Check cache first
      const cacheKey = `${FACT_CACHE_PREFIX}${query.chatId}:${query.subject}`;
      const cachedFactoid = await this.cacheService.get<IFactoid>(cacheKey);

      if (cachedFactoid) {
        this.logger.debug(`Cache hit for subject: ${query.subject}`);
        return {
          factoid: cachedFactoid,
          confidence: 1.0,
        };
      }

      // Try exact match first
      const exactMatch = await this.factoidsRepository.findBySubject(
        query.chatId,
        query.subject,
      );

      if (exactMatch) {
        // Cache the result
        await this.cacheService.set(cacheKey, exactMatch);

        const elapsed = Date.now() - startTime;
        this.logger.debug(
          `Found exact match for "${query.subject}" in ${elapsed}ms`,
        );

        return {
          factoid: exactMatch,
          confidence: 1.0,
        };
      }

      // If no exact match and using similarity search
      if (query.algorithm !== SimilarityAlgorithm.EXACT) {
        return this.findSimilarFact(query, startTime);
      }

      const elapsed = Date.now() - startTime;
      this.logger.debug(`No fact found for "${query.subject}" in ${elapsed}ms`);

      return {
        factoid: undefined,
        confidence: 0,
      };
    } catch (error) {
      this.logger.error(
        `Error finding fact for "${query.subject}": ${error}`,
        error,
      );
      return {
        error: `Failed to find fact: ${error}`,
      };
    }
  }

  private async findSimilarFact(
    query: FindFactQuery,
    startTime: number,
  ): Promise<FindFactQueryResult> {
    // Get all facts for this chat (with limit for performance)
    const allFacts = await this.factoidsRepository.findByChatId(
      query.chatId,
      1000,
    );

    let bestMatch: IFactoid | null = null;
    let bestConfidence = 0;

    for (const factoid of allFacts) {
      // Check timeout to ensure we meet performance requirements
      if (Date.now() - startTime > QUERY_TIMEOUT_MS) {
        this.logger.warn(`Query timeout reached for subject: ${query.subject}`);
        break;
      }

      const similarity = await this.naturalLanguageService.calculateSimilarity(
        query.subject,
        factoid.subject,
        query.algorithm,
      );

      if (similarity > bestConfidence && similarity >= query.minConfidence) {
        bestMatch = factoid;
        bestConfidence = similarity;
      }
    }

    const elapsed = Date.now() - startTime;

    if (bestMatch) {
      // Cache the result
      const cacheKey = `${FACT_CACHE_PREFIX}${query.chatId}:${query.subject}`;
      await this.cacheService.set(cacheKey, bestMatch);

      this.logger.debug(
        `Found similar match for "${query.subject}" -> "${bestMatch.subject}" (confidence: ${bestConfidence}) in ${elapsed}ms`,
      );

      return {
        factoid: bestMatch,
        confidence: bestConfidence,
      };
    }

    this.logger.debug(
      `No similar fact found for "${query.subject}" in ${elapsed}ms`,
    );

    return {
      factoid: undefined,
      confidence: 0,
    };
  }
}
