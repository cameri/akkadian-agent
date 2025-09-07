import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { IReminderJob } from '../reminders.types';
import {
  ReminderJob,
  ReminderJobDocument,
} from '../schemas/reminder-job.schema';

@Injectable()
export class ReminderJobsRepository {
  private readonly logger = new Logger(ReminderJobsRepository.name);

  constructor(
    @InjectModel(ReminderJob.name)
    private readonly reminderJobModel: Model<ReminderJobDocument>,
  ) {}

  /**
   * Creates a new reminder job
   */
  async create(jobData: Partial<IReminderJob>): Promise<IReminderJob> {
    try {
      const job = new this.reminderJobModel(jobData);
      const saved = await job.save();
      this.logger.debug(
        `Created reminder job for reminder ${saved.reminderId}`,
      );
      return saved.toObject();
    } catch (error) {
      this.logger.error('Error creating reminder job:', error);
      throw error;
    }
  }

  /**
   * Finds a job by reminder ID
   */
  async findByReminderId(reminderId: string): Promise<IReminderJob | null> {
    try {
      const job = await this.reminderJobModel.findOne({ reminderId }).exec();

      return job?.toObject() || null;
    } catch (error) {
      this.logger.error(`Error finding job for reminder ${reminderId}:`, error);
      return null;
    }
  }

  /**
   * Updates a job by reminder ID
   */
  async updateByReminderId(
    reminderId: string,
    updates: Partial<IReminderJob>,
  ): Promise<IReminderJob | null> {
    try {
      const job = await this.reminderJobModel
        .findOneAndUpdate(
          { reminderId },
          {
            ...updates,
            updatedAt: new Date(),
          },
          { new: true },
        )
        .exec();

      if (job) {
        this.logger.debug(`Updated job for reminder ${reminderId}`);
      }

      return job?.toObject() || null;
    } catch (error) {
      this.logger.error(
        `Error updating job for reminder ${reminderId}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Finds jobs by status
   */
  async findByStatus(
    status: 'pending' | 'processing' | 'completed' | 'failed',
    limit?: number,
  ): Promise<IReminderJob[]> {
    try {
      let query = this.reminderJobModel
        .find({ status })
        .sort({ scheduledFor: 1 });

      if (limit) {
        query = query.limit(limit);
      }

      const jobs = await query.exec();
      return jobs.map((job) => job.toObject());
    } catch (error) {
      this.logger.error(`Error finding jobs by status ${status}:`, error);
      return [];
    }
  }

  /**
   * Finds overdue pending jobs
   */
  async findOverduePendingJobs(minutes: number = 5): Promise<IReminderJob[]> {
    try {
      const cutoffDate = new Date(Date.now() - minutes * 60 * 1000);

      const jobs = await this.reminderJobModel
        .find({
          status: 'pending',
          scheduledFor: { $lt: cutoffDate },
        })
        .sort({ scheduledFor: 1 })
        .exec();

      return jobs.map((job) => job.toObject());
    } catch (error) {
      this.logger.error('Error finding overdue pending jobs:', error);
      return [];
    }
  }

  /**
   * Finds failed jobs that can be retried
   */
  async findRetriableFailedJobs(
    maxAttempts: number = 3,
  ): Promise<IReminderJob[]> {
    try {
      const jobs = await this.reminderJobModel
        .find({
          status: 'failed',
          attempts: { $lt: maxAttempts },
        })
        .sort({ lastAttemptAt: 1 })
        .exec();

      return jobs.map((job) => job.toObject());
    } catch (error) {
      this.logger.error('Error finding retriable failed jobs:', error);
      return [];
    }
  }

  /**
   * Gets job statistics
   */
  async getJobStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
  }> {
    try {
      const [pending, processing, completed, failed, total] = await Promise.all(
        [
          this.reminderJobModel.countDocuments({ status: 'pending' }),
          this.reminderJobModel.countDocuments({ status: 'processing' }),
          this.reminderJobModel.countDocuments({ status: 'completed' }),
          this.reminderJobModel.countDocuments({ status: 'failed' }),
          this.reminderJobModel.countDocuments({}),
        ],
      );

      return { pending, processing, completed, failed, total };
    } catch (error) {
      this.logger.error('Error getting job statistics:', error);
      return { pending: 0, processing: 0, completed: 0, failed: 0, total: 0 };
    }
  }

  /**
   * Deletes old completed/failed jobs
   */
  async deleteOldJobs(olderThan: Date): Promise<number> {
    try {
      const result = await this.reminderJobModel
        .deleteMany({
          status: { $in: ['completed', 'failed'] },
          createdAt: { $lt: olderThan },
        })
        .exec();

      this.logger.debug(`Deleted ${result.deletedCount} old job records`);
      return result.deletedCount;
    } catch (error) {
      this.logger.error('Error deleting old jobs:', error);
      return 0;
    }
  }

  /**
   * Increments attempt counter for a job
   */
  async incrementAttempts(reminderId: string): Promise<IReminderJob | null> {
    try {
      const job = await this.reminderJobModel
        .findOneAndUpdate(
          { reminderId },
          {
            $inc: { attempts: 1 },
            lastAttemptAt: new Date(),
            updatedAt: new Date(),
          },
          { new: true },
        )
        .exec();

      return job?.toObject() || null;
    } catch (error) {
      this.logger.error(
        `Error incrementing attempts for reminder ${reminderId}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Resets job attempts (used for manual retry)
   */
  async resetAttempts(reminderId: string): Promise<IReminderJob | null> {
    try {
      const job = await this.reminderJobModel
        .findOneAndUpdate(
          { reminderId },
          {
            attempts: 0,
            status: 'pending',
            errorMessage: undefined,
            lastAttemptAt: undefined,
            updatedAt: new Date(),
          },
          { new: true },
        )
        .exec();

      if (job) {
        this.logger.debug(`Reset attempts for reminder ${reminderId}`);
      }

      return job?.toObject() || null;
    } catch (error) {
      this.logger.error(
        `Error resetting attempts for reminder ${reminderId}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Deletes a job by reminder ID
   */
  async deleteByReminderId(reminderId: string): Promise<boolean> {
    try {
      const result = await this.reminderJobModel
        .deleteOne({ reminderId })
        .exec();

      if (result.deletedCount > 0) {
        this.logger.debug(`Deleted job for reminder ${reminderId}`);
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(
        `Error deleting job for reminder ${reminderId}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Finds jobs scheduled within a date range
   */
  async findJobsInDateRange(
    fromDate: Date,
    toDate: Date,
    status?: string,
  ): Promise<IReminderJob[]> {
    try {
      const filter: any = {
        scheduledFor: { $gte: fromDate, $lte: toDate },
      };

      if (status) {
        filter.status = status;
      }

      const jobs = await this.reminderJobModel
        .find(filter)
        .sort({ scheduledFor: 1 })
        .exec();

      return jobs.map((job) => job.toObject());
    } catch (error) {
      this.logger.error('Error finding jobs in date range:', error);
      return [];
    }
  }
}
