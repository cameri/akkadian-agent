import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import type { IReminder, ReminderStatus } from '../reminders.types';
import { Reminder, ReminderDocument } from '../schemas/reminder.schema';
import { REMINDER_STATUS } from '../reminders.constants';

@Injectable()
export class RemindersRepository {
  private readonly logger = new Logger(RemindersRepository.name);

  constructor(
    @InjectModel(Reminder.name)
    private readonly reminderModel: Model<ReminderDocument>,
  ) {}

  /**
   * Creates a new reminder
   */
  async create(reminderData: Partial<IReminder>): Promise<IReminder> {
    try {
      const reminder = new this.reminderModel(reminderData);
      const saved = await reminder.save();
      this.logger.debug(`Created reminder ${saved._id.toString()}`);
      return { ...saved.toObject(), _id: saved._id.toString() };
    } catch (error) {
      this.logger.error('Error creating reminder:', error);
      throw error;
    }
  }

  /**
   * Finds a reminder by ID
   */
  async findById(reminderId: string): Promise<IReminder | null> {
    try {
      const reminder = await this.reminderModel
        .findOne({
          _id: reminderId,
          deletedAt: { $exists: false },
        })
        .exec();

      return reminder
        ? { ...reminder.toObject(), _id: reminder._id.toString() }
        : null;
    } catch (error) {
      this.logger.error(`Error finding reminder ${reminderId}:`, error);
      return null;
    }
  }

  /**
   * Finds and updates a reminder by ID
   */
  async findByIdAndUpdate(
    reminderId: string,
    updates: Partial<IReminder>,
  ): Promise<IReminder | null> {
    try {
      const reminder = await this.reminderModel
        .findOneAndUpdate(
          {
            _id: reminderId,
            deletedAt: { $exists: false },
          },
          {
            ...updates,
            updatedAt: new Date(),
          },
          { new: true },
        )
        .exec();

      if (reminder) {
        this.logger.debug(`Updated reminder ${reminderId}`);
      }

      return reminder
        ? { ...reminder.toObject(), _id: reminder._id.toString() }
        : null;
    } catch (error) {
      this.logger.error(`Error updating reminder ${reminderId}:`, error);
      return null;
    }
  }

  /**
   * Soft deletes a reminder by ID
   */
  async deleteById(reminderId: string): Promise<boolean> {
    try {
      const result = await this.reminderModel
        .findOneAndUpdate(
          {
            _id: reminderId,
            deletedAt: { $exists: false },
          },
          {
            deletedAt: new Date(),
            status: REMINDER_STATUS.CANCELLED,
            updatedAt: new Date(),
          },
          { new: true },
        )
        .exec();

      if (result) {
        this.logger.debug(`Deleted reminder ${reminderId}`);
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(`Error deleting reminder ${reminderId}:`, error);
      return false;
    }
  }

  /**
   * Finds reminders by user ID with filtering and pagination
   */
  async findByUserId(
    userId: string,
    options: {
      chatId?: string;
      status?: ReminderStatus;
      limit?: number;
      offset?: number;
      includeDeleted?: boolean;
    } = {},
  ): Promise<{ reminders: IReminder[]; total: number }> {
    try {
      const {
        chatId,
        status,
        limit = 10,
        offset = 0,
        includeDeleted = false,
      } = options;

      // Build filter query
      const filter: FilterQuery<ReminderDocument> = { userId };

      if (chatId) {
        filter.chatId = chatId;
      }

      if (status) {
        filter.status = status;
      }

      if (!includeDeleted) {
        filter.deletedAt = { $exists: false };
      }

      // Execute queries in parallel
      const [reminders, total] = await Promise.all([
        this.reminderModel
          .find(filter)
          .sort({ scheduledFor: 1 })
          .skip(offset)
          .limit(limit)
          .exec(),
        this.reminderModel.countDocuments(filter).exec(),
      ]);

      return {
        reminders: reminders.map((r) => ({
          ...r.toObject(),
          _id: r._id.toString(),
        })),
        total,
      };
    } catch (error) {
      this.logger.error(`Error finding reminders for user ${userId}:`, error);
      return { reminders: [], total: 0 };
    }
  }

  /**
   * Finds reminders by chat ID
   */
  async findByChatId(
    chatId: string,
    options: {
      status?: ReminderStatus;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<{ reminders: IReminder[]; total: number }> {
    try {
      const { status, limit = 10, offset = 0 } = options;

      const filter: FilterQuery<ReminderDocument> = {
        chatId,
        deletedAt: { $exists: false },
      };

      if (status) {
        filter.status = status;
      }

      const [reminders, total] = await Promise.all([
        this.reminderModel
          .find(filter)
          .sort({ scheduledFor: 1 })
          .skip(offset)
          .limit(limit)
          .exec(),
        this.reminderModel.countDocuments(filter).exec(),
      ]);

      return {
        reminders: reminders.map((r) => ({
          ...r.toObject(),
          _id: r._id.toString(),
        })),
        total,
      };
    } catch (error) {
      this.logger.error(`Error finding reminders for chat ${chatId}:`, error);
      return { reminders: [], total: 0 };
    }
  }

  /**
   * Finds pending reminders (for scheduler initialization)
   */
  async findPendingReminders(): Promise<IReminder[]> {
    try {
      const reminders = await this.reminderModel
        .find({
          status: REMINDER_STATUS.PENDING,
          deletedAt: { $exists: false },
        })
        .sort({ scheduledFor: 1 })
        .exec();

      return reminders.map((r) => ({ ...r.toObject(), _id: r._id.toString() }));
    } catch (error) {
      this.logger.error('Error finding pending reminders:', error);
      return [];
    }
  }

  /**
   * Finds due reminders (scheduled time has passed)
   */
  async findDueReminders(graceMinutes: number = 5): Promise<IReminder[]> {
    try {
      const now = new Date();
      const gracePeriod = new Date(now.getTime() - graceMinutes * 60000);

      const reminders = await this.reminderModel
        .find({
          status: REMINDER_STATUS.PENDING,
          scheduledFor: { $lte: now, $gte: gracePeriod },
          deletedAt: { $exists: false },
        })
        .sort({ scheduledFor: 1 })
        .exec();

      return reminders.map((r) => ({ ...r.toObject(), _id: r._id.toString() }));
    } catch (error) {
      this.logger.error('Error finding due reminders:', error);
      return [];
    }
  }

  /**
   * Finds upcoming reminders within a date range
   */
  async findUpcomingReminders(
    fromDate: Date,
    toDate: Date,
    limit?: number,
  ): Promise<IReminder[]> {
    try {
      let query = this.reminderModel
        .find({
          status: REMINDER_STATUS.PENDING,
          scheduledFor: { $gte: fromDate, $lte: toDate },
          deletedAt: { $exists: false },
        })
        .sort({ scheduledFor: 1 });

      if (limit) {
        query = query.limit(limit);
      }

      const reminders = await query.exec();
      return reminders.map((r) => ({ ...r.toObject(), _id: r._id.toString() }));
    } catch (error) {
      this.logger.error('Error finding upcoming reminders:', error);
      return [];
    }
  }

  /**
   * Counts active reminders for a user
   */
  async countActiveRemindersByUser(userId: string): Promise<number> {
    try {
      return await this.reminderModel
        .countDocuments({
          userId,
          status: { $in: [REMINDER_STATUS.PENDING] },
          deletedAt: { $exists: false },
        })
        .exec();
    } catch (error) {
      this.logger.error(`Error counting reminders for user ${userId}:`, error);
      return 0;
    }
  }

  /**
   * Searches reminders by text content
   */
  async searchReminders(
    userId: string,
    searchText: string,
    limit: number = 10,
  ): Promise<IReminder[]> {
    try {
      const reminders = await this.reminderModel
        .find({
          userId,
          $text: { $search: searchText },
          deletedAt: { $exists: false },
        })
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit)
        .exec();

      return reminders.map((r) => ({ ...r.toObject(), _id: r._id.toString() }));
    } catch (error) {
      this.logger.error(`Error searching reminders for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Gets reminder statistics for a user
   */
  async getUserStats(userId: string): Promise<{
    total: number;
    pending: number;
    delivered: number;
    cancelled: number;
    failed: number;
  }> {
    try {
      const [total, pending, delivered, cancelled, failed] = await Promise.all([
        this.reminderModel.countDocuments({
          userId,
          deletedAt: { $exists: false },
        }),
        this.reminderModel.countDocuments({
          userId,
          status: REMINDER_STATUS.PENDING,
          deletedAt: { $exists: false },
        }),
        this.reminderModel.countDocuments({
          userId,
          status: REMINDER_STATUS.DELIVERED,
          deletedAt: { $exists: false },
        }),
        this.reminderModel.countDocuments({
          userId,
          status: REMINDER_STATUS.CANCELLED,
          deletedAt: { $exists: false },
        }),
        this.reminderModel.countDocuments({
          userId,
          status: REMINDER_STATUS.FAILED,
          deletedAt: { $exists: false },
        }),
      ]);

      return { total, pending, delivered, cancelled, failed };
    } catch (error) {
      this.logger.error(`Error getting stats for user ${userId}:`, error);
      return { total: 0, pending: 0, delivered: 0, cancelled: 0, failed: 0 };
    }
  }

  /**
   * Bulk updates reminder statuses
   */
  async bulkUpdateStatus(
    reminderIds: string[],
    status: ReminderStatus,
  ): Promise<number> {
    try {
      const result = await this.reminderModel
        .updateMany(
          {
            _id: { $in: reminderIds },
            deletedAt: { $exists: false },
          },
          {
            status,
            updatedAt: new Date(),
          },
        )
        .exec();

      this.logger.debug(
        `Bulk updated ${result.modifiedCount} reminders to status: ${status}`,
      );
      return result.modifiedCount;
    } catch (error) {
      this.logger.error('Error bulk updating reminder statuses:', error);
      return 0;
    }
  }
}
