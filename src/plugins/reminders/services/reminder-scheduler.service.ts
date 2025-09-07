import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { DateTime } from 'luxon';
import type { IReminder } from '../reminders.types';
import { RemindersRepository } from '../repositories/reminders.repository';
import { ReminderJobsRepository } from '../repositories/reminder-jobs.repository';
import { TimezoneService } from './timezone.service';
import {
  REMINDER_CHECK_INTERVAL,
  REMINDER_EXECUTION_GRACE_PERIOD,
  REMINDER_STATUS,
} from '../reminders.constants';
import { ReminderDeliveredEvent, ReminderFailedEvent } from '../events';

@Injectable()
export class ReminderSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReminderSchedulerService.name);
  private readonly activeJobs = new Map<string, NodeJS.Timeout>();
  private checkInterval?: NodeJS.Timeout;

  constructor(
    private readonly eventBus: EventBus,
    private readonly remindersRepository: RemindersRepository,
    private readonly reminderJobsRepository: ReminderJobsRepository,
    private readonly timezoneService: TimezoneService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      // Set up recurring check interval
      this.setupRecurringJobs();

      // Load and schedule existing pending reminders
      await this.loadAndSchedulePendingReminders();

      this.logger.log('Reminder scheduler initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize reminder scheduler:', error);
    }
  }

  onModuleDestroy(): void {
    // Clean up active timeouts
    for (const [jobId, timeout] of this.activeJobs) {
      clearTimeout(timeout);
      this.activeJobs.delete(jobId);
    }

    // Clean up check interval
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.logger.log('Reminder scheduler cleaned up');
  }

  /**
   * Schedules a reminder for delivery
   */
  async scheduleReminder(reminder: IReminder): Promise<void> {
    try {
      this.logger.debug(
        `Scheduling reminder ${reminder._id} for ${reminder.scheduledFor.toISOString()}`,
      );

      // Create a job record
      await this.reminderJobsRepository.create({
        reminderId: reminder._id?.toString() || '',
        scheduledFor: reminder.scheduledFor,
        status: 'pending',
        attempts: 0,
        maxAttempts: 3,
      });

      // Schedule the actual delivery
      await this.scheduleJob(reminder);

      this.logger.log(`Reminder ${reminder._id} scheduled successfully`);
    } catch (error) {
      this.logger.error(`Error scheduling reminder ${reminder._id}:`, error);
      throw error;
    }
  }

  /**
   * Cancels a scheduled reminder
   */
  async cancelReminder(reminderId: string): Promise<void> {
    try {
      // Cancel the timeout if it exists
      const timeout = this.activeJobs.get(reminderId);
      if (timeout) {
        clearTimeout(timeout);
        this.activeJobs.delete(reminderId);
      }

      // Update the job status
      await this.reminderJobsRepository.updateByReminderId(reminderId, {
        status: 'completed', // Mark as completed to prevent processing
        updatedAt: new Date(),
      });

      this.logger.debug(`Cancelled scheduled reminder ${reminderId}`);
    } catch (error) {
      this.logger.error(`Error cancelling reminder ${reminderId}:`, error);
    }
  }

  /**
   * Reschedules a reminder (used for recurring reminders)
   */
  async rescheduleReminder(
    reminder: IReminder,
    newScheduledTime: Date,
  ): Promise<void> {
    try {
      // Cancel existing schedule
      await this.cancelReminder(reminder._id?.toString() || '');

      // Update reminder with new schedule time
      const updatedReminder = await this.remindersRepository.findByIdAndUpdate(
        reminder._id?.toString() || '',
        {
          scheduledFor: newScheduledTime,
          status: REMINDER_STATUS.PENDING,
        },
      );

      if (updatedReminder) {
        // Schedule the new time
        await this.scheduleReminder(updatedReminder);
      }
    } catch (error) {
      this.logger.error(`Error rescheduling reminder ${reminder._id}:`, error);
    }
  }

  /**
   * Sets up recurring intervals for system maintenance
   */
  private setupRecurringJobs(): void {
    // Check for due reminders every minute
    this.checkInterval = setInterval(() => {
      this.processDueReminders().catch((error) => {
        this.logger.error('Error in recurring reminder check:', error);
      });
    }, REMINDER_CHECK_INTERVAL);

    this.logger.log('Recurring scheduler jobs set up successfully');
  }

  /**
   * Loads pending reminders from database and schedules them
   */
  private async loadAndSchedulePendingReminders(): Promise<void> {
    try {
      const pendingReminders =
        await this.remindersRepository.findPendingReminders();

      for (const reminder of pendingReminders) {
        await this.scheduleJob(reminder);
      }

      this.logger.log(
        `Loaded and scheduled ${pendingReminders.length} pending reminders`,
      );
    } catch (error) {
      this.logger.error('Error loading pending reminders:', error);
    }
  }

  /**
   * Schedules an individual reminder job
   */
  private async scheduleJob(reminder: IReminder): Promise<void> {
    const reminderId = reminder._id?.toString() || '';
    const now = new Date();
    const scheduledTime = new Date(reminder.scheduledFor);
    const delay = Math.max(0, scheduledTime.getTime() - now.getTime());

    // If the reminder is more than 5 minutes overdue, mark as failed
    if (delay < -REMINDER_EXECUTION_GRACE_PERIOD) {
      await this.markReminderAsFailed(
        reminderId,
        `Reminder is overdue by more than ${REMINDER_EXECUTION_GRACE_PERIOD / 1000 / 60} minutes`,
      );
      return;
    }

    // Schedule the delivery
    const timeout = setTimeout(() => {
      void this.deliverReminder(reminder);
      this.activeJobs.delete(reminderId);
    }, delay);

    this.activeJobs.set(reminderId, timeout);

    this.logger.debug(
      `Scheduled reminder ${reminderId} for delivery in ${delay}ms (at ${scheduledTime.toISOString()})`,
    );
  }

  /**
   * Delivers a reminder to the user
   */
  private async deliverReminder(reminder: IReminder): Promise<void> {
    const reminderId = reminder._id?.toString() || '';

    try {
      this.logger.debug(`Delivering reminder ${reminderId}`);

      // Update job status to processing
      await this.reminderJobsRepository.updateByReminderId(reminderId, {
        status: 'processing',
        lastAttemptAt: new Date(),
      });

      // Emit event for delivery (transport modules will handle actual delivery)
      this.eventBus.publish(
        new ReminderDeliveredEvent(reminder, new Date(), reminder.transport),
      );

      // Update reminder status
      await this.remindersRepository.findByIdAndUpdate(reminderId, {
        status: REMINDER_STATUS.DELIVERED,
      });

      // Update job status
      await this.reminderJobsRepository.updateByReminderId(reminderId, {
        status: 'completed',
      });

      // Handle recurring reminders
      if (reminder.recurrence !== 'none' && reminder.nextOccurrence) {
        await this.scheduleRecurringReminder(reminder);
      }

      this.logger.log(`Successfully delivered reminder ${reminderId}`);
    } catch (error) {
      this.logger.error(`Error delivering reminder ${reminderId}:`, error);
      await this.handleDeliveryFailure(reminder, error as Error);
    }
  }

  /**
   * Handles recurring reminder scheduling
   */
  private async scheduleRecurringReminder(reminder: IReminder): Promise<void> {
    try {
      if (!reminder.nextOccurrence) return;

      // Create a new reminder for the next occurrence
      const nextReminder = await this.remindersRepository.create({
        userId: reminder.userId,
        chatId: reminder.chatId,
        title: reminder.title,
        message: reminder.message,
        scheduledFor: reminder.nextOccurrence,
        timezone: reminder.timezone,
        status: REMINDER_STATUS.PENDING,
        priority: reminder.priority,
        recurrence: reminder.recurrence,
        nextOccurrence: this.calculateNextOccurrence(
          reminder.nextOccurrence,
          reminder.recurrence,
          reminder.timezone,
        ),
        transport: reminder.transport,
        transportSpecific: reminder.transportSpecific,
      });

      // Schedule the new reminder
      await this.scheduleReminder(nextReminder);

      this.logger.debug(
        `Scheduled recurring reminder: ${reminder._id} -> ${nextReminder._id}`,
      );
    } catch (error) {
      this.logger.error(
        `Error scheduling recurring reminder for ${reminder._id}:`,
        error,
      );
    }
  }

  /**
   * Calculates the next occurrence for a recurring reminder
   */
  private calculateNextOccurrence(
    currentDate: Date,
    recurrence: string,
    timezone: string,
  ): Date | undefined {
    const dt = DateTime.fromJSDate(currentDate, { zone: timezone });

    switch (recurrence) {
      case 'daily':
        return dt.plus({ days: 1 }).toJSDate();
      case 'weekly':
        return dt.plus({ weeks: 1 }).toJSDate();
      case 'monthly':
        return dt.plus({ months: 1 }).toJSDate();
      case 'yearly':
        return dt.plus({ years: 1 }).toJSDate();
      default:
        return undefined;
    }
  }

  /**
   * Handles delivery failures and retry logic
   */
  private async handleDeliveryFailure(
    reminder: IReminder,
    error: Error,
  ): Promise<void> {
    const reminderId = reminder._id?.toString() || '';

    try {
      // Get current job
      const job =
        await this.reminderJobsRepository.findByReminderId(reminderId);
      if (!job) return;

      const attempts = job.attempts + 1;

      if (attempts >= job.maxAttempts) {
        // Max attempts reached, mark as failed
        await this.markReminderAsFailed(reminderId, error.message);
        this.eventBus.publish(
          new ReminderFailedEvent(reminder, error.message, attempts),
        );
      } else {
        // Schedule retry with exponential backoff
        const retryDelay = Math.min(300000, Math.pow(2, attempts) * 60000); // Max 5 minutes

        await this.reminderJobsRepository.updateByReminderId(reminderId, {
          attempts,
          status: 'pending',
          errorMessage: error.message,
          lastAttemptAt: new Date(),
        });

        // Schedule retry
        const timeout = setTimeout(() => {
          void this.deliverReminder(reminder);
          this.activeJobs.delete(`${reminderId}-retry-${attempts}`);
        }, retryDelay);

        this.activeJobs.set(`${reminderId}-retry-${attempts}`, timeout);

        this.logger.debug(
          `Scheduled retry ${attempts}/${job.maxAttempts} for reminder ${reminderId} in ${retryDelay}ms`,
        );
      }
    } catch (retryError) {
      this.logger.error(
        `Error handling delivery failure for reminder ${reminderId}:`,
        retryError,
      );
    }
  }

  /**
   * Marks a reminder as failed
   */
  private async markReminderAsFailed(
    reminderId: string,
    errorMessage: string,
  ): Promise<void> {
    await Promise.all([
      this.remindersRepository.findByIdAndUpdate(reminderId, {
        status: REMINDER_STATUS.FAILED,
      }),
      this.reminderJobsRepository.updateByReminderId(reminderId, {
        status: 'failed',
        errorMessage,
      }),
    ]);

    this.logger.warn(
      `Marked reminder ${reminderId} as failed: ${errorMessage}`,
    );
  }

  /**
   * Processes due reminders (backup to timeout-based scheduling)
   */
  private async processDueReminders(): Promise<void> {
    try {
      const dueReminders = await this.remindersRepository.findDueReminders();

      for (const reminder of dueReminders) {
        const reminderId = reminder._id?.toString() || '';

        // Check if already being processed
        if (this.activeJobs.has(reminderId)) {
          continue;
        }

        this.logger.debug(`Processing due reminder ${reminderId}`);
        await this.deliverReminder(reminder);
      }
    } catch (error) {
      this.logger.error('Error processing due reminders:', error);
    }
  }
}
