import { Logger } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetUpcomingRemindersQuery } from '../queries/get-upcoming-reminders.query';
import type { GetUpcomingRemindersQueryResult } from '../reminders.types';
import { RemindersRepository } from '../repositories/reminders.repository';
import { CacheService } from '../../../cache';
import { UPCOMING_REMINDERS_CACHE_PREFIX } from '../reminders.constants';

@QueryHandler(GetUpcomingRemindersQuery)
export class GetUpcomingRemindersQueryHandler
  implements
    IQueryHandler<GetUpcomingRemindersQuery, GetUpcomingRemindersQueryResult>
{
  private readonly logger = new Logger(GetUpcomingRemindersQueryHandler.name);

  constructor(
    private readonly remindersRepository: RemindersRepository,
    private readonly cacheService: CacheService,
  ) {}

  async execute(
    query: GetUpcomingRemindersQuery,
  ): Promise<GetUpcomingRemindersQueryResult> {
    try {
      this.logger.debug(
        `Getting upcoming reminders from ${query.fromDate.toISOString()} to ${query.toDate.toISOString()}`,
      );

      // Create cache key based on date range
      const cacheKey = this.createCacheKey(query);

      // Try to get from cache first (short TTL for upcoming reminders)
      const cached =
        await this.cacheService.get<GetUpcomingRemindersQueryResult>(cacheKey);
      if (cached) {
        this.logger.debug('Returning cached upcoming reminders');
        return cached;
      }

      // Fetch from database
      const reminders = await this.remindersRepository.findUpcomingReminders(
        query.fromDate,
        query.toDate,
        query.limit,
      );

      const result: GetUpcomingRemindersQueryResult = {
        reminders,
        total: reminders.length,
      };

      // Cache for a short time (2 minutes) since upcoming reminders change frequently
      await this.cacheService.set(cacheKey, result, 120);

      this.logger.debug(`Found ${reminders.length} upcoming reminders`);

      return result;
    } catch (error) {
      this.logger.error('Error getting upcoming reminders:', error);
      return {
        reminders: [],
        total: 0,
      };
    }
  }

  /**
   * Creates a cache key based on query parameters
   */
  private createCacheKey(query: GetUpcomingRemindersQuery): string {
    const fromTime = query.fromDate.getTime();
    const toTime = query.toDate.getTime();
    const limit = query.limit || 'no-limit';

    return `${UPCOMING_REMINDERS_CACHE_PREFIX}${fromTime}:${toTime}:${limit}`;
  }
}
