import { Logger } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetReminderQuery } from '../queries/get-reminder.query';
import type { GetReminderQueryResult, IReminder } from '../reminders.types';
import { RemindersRepository } from '../repositories/reminders.repository';
import { CacheService } from '../../../cache';
import {
  REMINDER_CACHE_PREFIX,
  REMINDER_CACHE_TTL,
} from '../reminders.constants';

@QueryHandler(GetReminderQuery)
export class GetReminderQueryHandler
  implements IQueryHandler<GetReminderQuery, GetReminderQueryResult>
{
  private readonly logger = new Logger(GetReminderQueryHandler.name);

  constructor(
    private readonly remindersRepository: RemindersRepository,
    private readonly cacheService: CacheService,
  ) {}

  async execute(query: GetReminderQuery): Promise<GetReminderQueryResult> {
    try {
      this.logger.debug(
        `Getting reminder ${query.reminderId} for user ${query.userId}`,
      );

      const cacheKey = `${REMINDER_CACHE_PREFIX}${query.reminderId}`;

      // Try to get from cache first
      const cachedReminder = await this.cacheService.get<IReminder>(cacheKey);
      if (cachedReminder) {
        // Verify user ownership
        if (cachedReminder.userId === query.userId) {
          this.logger.debug(`Returning cached reminder ${query.reminderId}`);
          return { reminder: cachedReminder };
        }
      }

      // Fetch from database
      const reminder = await this.remindersRepository.findById(
        query.reminderId,
      );

      // Check if reminder exists and user has access
      if (!reminder || reminder.userId !== query.userId) {
        return { reminder: null };
      }

      // Cache the reminder
      await this.cacheService.set(cacheKey, reminder, REMINDER_CACHE_TTL);

      this.logger.debug(
        `Found reminder ${query.reminderId} for user ${query.userId}`,
      );

      return { reminder };
    } catch (error) {
      this.logger.error(
        `Error getting reminder ${query.reminderId} for user ${query.userId}:`,
        error,
      );
      return { reminder: null };
    }
  }
}
