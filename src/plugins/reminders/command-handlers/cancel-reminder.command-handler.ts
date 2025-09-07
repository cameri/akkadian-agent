import { Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { CancelReminderCommand } from '../commands/cancel-reminder.command';
import type { CancelReminderCommandResult } from '../reminders.types';
import { RemindersRepository } from '../repositories/reminders.repository';
import { ReminderSchedulerService } from '../services/reminder-scheduler.service';
import { CacheService } from '../../../cache';
import {
  REMINDER_CACHE_PREFIX,
  USER_REMINDERS_CACHE_PREFIX,
  RESPONSE_TEMPLATES,
  REMINDER_STATUS,
} from '../reminders.constants';
import { ReminderCancelledEvent } from '../events';

@CommandHandler(CancelReminderCommand)
export class CancelReminderCommandHandler
  implements ICommandHandler<CancelReminderCommand, CancelReminderCommandResult>
{
  private readonly logger = new Logger(CancelReminderCommandHandler.name);

  constructor(
    private readonly remindersRepository: RemindersRepository,
    private readonly reminderSchedulerService: ReminderSchedulerService,
    private readonly cacheService: CacheService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    command: CancelReminderCommand,
  ): Promise<CancelReminderCommandResult> {
    try {
      this.logger.debug(
        `Cancelling reminder ${command.reminderId} for user ${command.userId}`,
      );

      // Find the reminder first to verify ownership
      const reminder = await this.remindersRepository.findById(
        command.reminderId,
      );

      if (!reminder) {
        return {
          success: false,
          error: RESPONSE_TEMPLATES.REMINDER_NOT_FOUND,
        };
      }

      // Verify user ownership
      if (reminder.userId !== command.userId) {
        return {
          success: false,
          error: RESPONSE_TEMPLATES.PERMISSION_DENIED,
        };
      }

      // Check if reminder is already cancelled or delivered
      if (reminder.status !== REMINDER_STATUS.PENDING) {
        return {
          success: false,
          error: 'Reminder is not in a cancellable state',
        };
      }

      // Cancel the scheduled job
      await this.reminderSchedulerService.cancelReminder(command.reminderId);

      // Update the reminder status (soft delete)
      const updatedReminder = await this.remindersRepository.deleteById(
        command.reminderId,
      );

      if (!updatedReminder) {
        return {
          success: false,
          error: RESPONSE_TEMPLATES.STORAGE_ERROR,
        };
      }

      // Remove from cache
      const cacheKey = `${REMINDER_CACHE_PREFIX}${command.reminderId}`;
      await this.cacheService.delete(cacheKey);

      // Invalidate user reminders cache
      const userCacheKey = `${USER_REMINDERS_CACHE_PREFIX}${command.userId}`;
      await this.cacheService.delete(userCacheKey);

      // Emit event
      this.eventBus.publish(
        new ReminderCancelledEvent(reminder, command.userId, new Date()),
      );

      const responseMessage = RESPONSE_TEMPLATES.REMINDER_CANCELLED.replace(
        '{title}',
        reminder.title,
      );

      this.logger.log(
        `Successfully cancelled reminder ${command.reminderId} for user ${command.userId}`,
      );

      return {
        success: true,
        message: responseMessage,
      };
    } catch (error) {
      this.logger.error(
        `Error cancelling reminder ${command.reminderId} for user ${command.userId}:`,
        error,
      );
      return {
        success: false,
        error: RESPONSE_TEMPLATES.STORAGE_ERROR,
      };
    }
  }
}
