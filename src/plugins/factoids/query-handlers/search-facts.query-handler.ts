import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { SearchFactsQuery } from '../queries/search-facts.query';
import type { SearchFactsQueryResult } from '../factoids.types';
import { FactoidsRepository } from '../repositories/factoids.repository';
import { NaturalLanguageService } from '../services/natural-language.service';
import { SimilarityAlgorithm, QUERY_TIMEOUT_MS } from '../factoids.constants';

@QueryHandler(SearchFactsQuery)
export class SearchFactsQueryHandler
  implements IQueryHandler<SearchFactsQuery, SearchFactsQueryResult>
{
  private readonly logger = new Logger(SearchFactsQueryHandler.name);

  constructor(
    private readonly factoidsRepository: FactoidsRepository,
    private readonly naturalLanguageService: NaturalLanguageService,
  ) {}

  async execute(query: SearchFactsQuery): Promise<SearchFactsQueryResult> {
    try {
      const startTime = Date.now();

      this.logger.debug(
        `Searching facts for chat ${query.chatId} with query: "${query.query}"`,
      );

      // Use MongoDB text search for performance
      const textSearchResults = await this.factoidsRepository.searchByText(
        query.chatId,
        query.query,
        query.limit,
      );

      if (
        textSearchResults.length > 0 ||
        query.algorithm === SimilarityAlgorithm.EXACT
      ) {
        const results = textSearchResults.map((factoid) => ({
          factoid,
          confidence: 1.0, // MongoDB text search doesn't provide confidence scores
        }));

        const elapsed = Date.now() - startTime;
        this.logger.debug(
          `Found ${results.length} facts via text search in ${elapsed}ms`,
        );

        return {
          factoids: results,
          total: results.length,
        };
      }

      // Fall back to similarity search if text search found nothing
      return this.performSimilaritySearch(query, startTime);
    } catch (error) {
      this.logger.error(`Error searching facts: ${error}`, error);
      return {
        factoids: [],
        total: 0,
        error: `Failed to search facts: ${error}`,
      };
    }
  }

  private async performSimilaritySearch(
    query: SearchFactsQuery,
    startTime: number,
  ): Promise<SearchFactsQueryResult> {
    // Get all facts for this chat
    const allFacts = await this.factoidsRepository.findByChatId(
      query.chatId,
      1000,
    );
    const matches: Array<{ factoid: any; confidence: number }> = [];

    for (const factoid of allFacts) {
      // Check timeout
      if (Date.now() - startTime > QUERY_TIMEOUT_MS) {
        this.logger.warn(`Search timeout reached for query: ${query.query}`);
        break;
      }

      // Calculate similarity for both subject and predicate
      const subjectSimilarity =
        await this.naturalLanguageService.calculateSimilarity(
          query.query,
          factoid.subject,
          query.algorithm,
        );

      const predicateSimilarity =
        await this.naturalLanguageService.calculateSimilarity(
          query.query,
          factoid.predicate,
          query.algorithm,
        );

      // Use the higher similarity score
      const bestSimilarity = Math.max(subjectSimilarity, predicateSimilarity);

      if (bestSimilarity >= query.minConfidence) {
        matches.push({
          factoid,
          confidence: bestSimilarity,
        });
      }
    }

    // Sort by confidence and limit results
    matches.sort((a, b) => b.confidence - a.confidence);
    const limitedResults = matches.slice(0, query.limit);

    const elapsed = Date.now() - startTime;
    this.logger.debug(
      `Found ${limitedResults.length} similar facts in ${elapsed}ms`,
    );

    return {
      factoids: limitedResults,
      total: limitedResults.length,
    };
  }
}
