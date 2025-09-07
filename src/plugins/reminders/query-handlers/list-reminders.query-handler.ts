import { Logger } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { ListRemindersQuery } from '../queries/list-reminders.query';
import type {
  ListRemindersQueryResult,
  ReminderStatus,
} from '../reminders.types';
import { RemindersRepository } from '../repositories/reminders.repository';
import { CacheService } from '../../../cache';
import {
  USER_REMINDERS_CACHE_PREFIX,
  USER_REMINDERS_CACHE_TTL,
} from '../reminders.constants';

@QueryHandler(ListRemindersQuery)
export class ListRemindersQueryHandler
  implements IQueryHandler<ListRemindersQuery, ListRemindersQueryResult>
{
  private readonly logger = new Logger(ListRemindersQueryHandler.name);

  constructor(
    private readonly remindersRepository: RemindersRepository,
    private readonly cacheService: CacheService,
  ) {}

  async execute(query: ListRemindersQuery): Promise<ListRemindersQueryResult> {
    try {
      this.logger.debug(
        `Listing reminders for user ${query.userId}, chatId: ${query.chatId}, status: ${query.status}`,
      );

      const limit = query.limit || 10;
      const offset = query.offset || 0;

      // Create cache key based on query parameters
      const cacheKey = this.createCacheKey(query);

      // Try to get from cache first (non-fatal if it fails)
      let cached: ListRemindersQueryResult | null | undefined;
      try {
        cached =
          await this.cacheService.get<ListRemindersQueryResult>(cacheKey);
        if (cached) {
          this.logger.debug(
            `Returning cached reminders for user ${query.userId}`,
          );
          return cached;
        }
      } catch (cacheError) {
        this.logger.warn(
          `Cache get failed for user ${query.userId}, falling back to database:`,
          cacheError,
        );
      }

      // Fetch from database
      const result = await this.remindersRepository.findByUserId(query.userId, {
        chatId: query.chatId,
        status: query.status as ReminderStatus,
        limit,
        offset,
      });

      const queryResult: ListRemindersQueryResult = {
        reminders: result.reminders,
        total: result.total,
        hasMore: offset + limit < result.total,
      };

      // Cache the result for a short time (non-fatal if it fails)
      try {
        await this.cacheService.set(
          cacheKey,
          queryResult,
          USER_REMINDERS_CACHE_TTL,
        );
      } catch (cacheError) {
        this.logger.warn(
          `Cache set failed for user ${query.userId}, continuing without cache:`,
          cacheError,
        );
      }

      this.logger.debug(
        `Found ${result.reminders.length} reminders for user ${query.userId} (${result.total} total)`,
      );

      return queryResult;
    } catch (error) {
      this.logger.error(
        `Error listing reminders for user ${query.userId}:`,
        error,
      );
      return {
        reminders: [],
        total: 0,
        hasMore: false,
      };
    }
  }

  /**
   * Creates a cache key based on query parameters
   */
  private createCacheKey(query: ListRemindersQuery): string {
    const parts = [
      USER_REMINDERS_CACHE_PREFIX + query.userId,
      query.chatId || 'all-chats',
      query.status || 'all-statuses',
      (query.limit || 10).toString(),
      (query.offset || 0).toString(),
    ];

    return parts.join(':');
  }
}
