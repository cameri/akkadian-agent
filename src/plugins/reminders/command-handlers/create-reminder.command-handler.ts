import { Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { CreateReminderCommand } from '../commands/create-reminder.command';
import type {
  CreateReminderCommandResult,
  ReminderPriority,
  RecurrencePattern,
} from '../reminders.types';
import { RemindersRepository } from '../repositories/reminders.repository';
import { DateParserService } from '../services/date-parser.service';
import { TimezoneService } from '../services/timezone.service';
import { ReminderSchedulerService } from '../services/reminder-scheduler.service';
import { CacheService } from '../../../cache';
import {
  REMINDER_CACHE_PREFIX,
  USER_REMINDERS_CACHE_PREFIX,
  MAX_REMINDERS_PER_USER,
  RESPONSE_TEMPLATES,
  REMINDER_STATUS,
  REMINDER_PRIORITY,
  RECURRENCE_PATTERN,
} from '../reminders.constants';
import { ReminderCreatedEvent } from '../events';

@CommandHandler(CreateReminderCommand)
export class CreateReminderCommandHandler
  implements ICommandHandler<CreateReminderCommand, CreateReminderCommandResult>
{
  private readonly logger = new Logger(CreateReminderCommandHandler.name);

  constructor(
    private readonly remindersRepository: RemindersRepository,
    private readonly dateParserService: DateParserService,
    private readonly timezoneService: TimezoneService,
    private readonly reminderSchedulerService: ReminderSchedulerService,
    private readonly cacheService: CacheService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    command: CreateReminderCommand,
  ): Promise<CreateReminderCommandResult> {
    try {
      this.logger.debug(
        `Creating reminder for user ${command.userId}: ${command.title} at ${command.dateTimeText}`,
      );

      // Check user's reminder limit
      const activeCount =
        await this.remindersRepository.countActiveRemindersByUser(
          command.userId,
        );
      if (activeCount >= MAX_REMINDERS_PER_USER) {
        return {
          success: false,
          error: RESPONSE_TEMPLATES.REMINDER_LIMIT_EXCEEDED,
        };
      }

      // Get user's timezone
      const userTimezone =
        command.timezone ||
        (await this.timezoneService.getUserTimezone(
          command.userId,
          command.chatId,
        ));

      // Parse the date/time text
      const parsedDateTime = this.dateParserService.parseDateTime(
        command.dateTimeText,
        userTimezone,
      );

      if (!parsedDateTime) {
        return {
          success: false,
          error: RESPONSE_TEMPLATES.INVALID_DATE_FORMAT,
        };
      }

      // Check if the date is in the past
      const now = new Date();
      if (parsedDateTime.date <= now) {
        return {
          success: false,
          error: RESPONSE_TEMPLATES.PAST_DATE_ERROR,
        };
      }

      // Validate and normalize priority
      const priority = this.validatePriority(command.priority);

      // Validate and normalize recurrence
      const recurrence = this.validateRecurrence(command.recurrence);

      // Calculate next occurrence for recurring reminders
      let nextOccurrence: Date | undefined;
      if (recurrence !== RECURRENCE_PATTERN.NONE) {
        nextOccurrence =
          this.dateParserService.calculateNextOccurrence(
            parsedDateTime.date,
            recurrence,
            userTimezone,
          ) || undefined;
      }

      // Adjust reminder time if it's outside reasonable hours
      const adjustedDate = await this.timezoneService.adjustToReasonableTime(
        command.userId,
        parsedDateTime.date,
      );

      // Create the reminder
      const reminder = await this.remindersRepository.create({
        userId: command.userId,
        chatId: command.chatId,
        title: command.title,
        message: command.message,
        scheduledFor: adjustedDate,
        timezone: userTimezone,
        status: REMINDER_STATUS.PENDING,
        priority,
        recurrence,
        nextOccurrence,
        transport: command.transport,
        transportSpecific: command.transportSpecific,
      });

      // Schedule the reminder for delivery
      await this.reminderSchedulerService.scheduleReminder(reminder);

      // Cache the reminder (non-fatal if it fails)
      try {
        const cacheKey = `${REMINDER_CACHE_PREFIX}${reminder._id}`;
        await this.cacheService.set(cacheKey, reminder);

        // Invalidate user reminders cache
        const userCacheKey = `${USER_REMINDERS_CACHE_PREFIX}${command.userId}`;
        await this.cacheService.delete(userCacheKey);
      } catch (cacheError) {
        this.logger.warn(
          `Cache operations failed for reminder ${reminder._id}, but reminder was created successfully:`,
          cacheError,
        );
      }

      // Emit event
      this.eventBus.publish(
        new ReminderCreatedEvent(reminder, command.userId, command.chatId),
      );

      // Format the scheduled date for display
      const formattedDate = this.dateParserService.formatDateTime(
        adjustedDate,
        userTimezone,
      );

      const responseMessage = RESPONSE_TEMPLATES.REMINDER_CREATED.replace(
        '{title}',
        command.title,
      ).replace('{scheduledFor}', formattedDate);

      this.logger.log(
        `Successfully created reminder ${reminder._id} for user ${command.userId}`,
      );

      return {
        success: true,
        reminder,
        message: responseMessage,
      };
    } catch (error) {
      this.logger.error(
        `Error creating reminder for user ${command.userId}:`,
        error,
      );
      return {
        success: false,
        error: RESPONSE_TEMPLATES.STORAGE_ERROR,
      };
    }
  }

  /**
   * Validates and normalizes priority value
   */
  private validatePriority(priority: number | undefined): ReminderPriority {
    if (priority === undefined) {
      return REMINDER_PRIORITY.NORMAL;
    }

    if (priority >= 1 && priority <= 4) {
      return priority as ReminderPriority;
    }

    return REMINDER_PRIORITY.NORMAL;
  }

  /**
   * Validates and normalizes recurrence pattern
   */
  private validateRecurrence(
    recurrence: string | undefined,
  ): RecurrencePattern {
    if (!recurrence) {
      return RECURRENCE_PATTERN.NONE;
    }

    const normalizedRecurrence = recurrence.toLowerCase();
    const validPatterns = Object.values(RECURRENCE_PATTERN);

    if (validPatterns.includes(normalizedRecurrence as RecurrencePattern)) {
      return normalizedRecurrence as RecurrencePattern;
    }

    return RECURRENCE_PATTERN.NONE;
  }
}
