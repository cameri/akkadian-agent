import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { HydratedDocument } from 'mongoose';
import type { IReminderJob } from '../reminders.types';
import { ReminderJobsCollectionName } from '../reminders.constants';

export type ReminderJobDocument = HydratedDocument<ReminderJob>;

@Schema({
  timestamps: true, // Automatically adds `createdAt` and `updatedAt`
  collection: ReminderJobsCollectionName,
})
export class ReminderJob implements IReminderJob {
  @IsString()
  @Prop({ required: true, index: true })
  reminderId!: string;

  @IsDate()
  @Prop({ required: true, index: true })
  scheduledFor!: Date;

  @IsEnum(['pending', 'processing', 'completed', 'failed'])
  @Prop({
    required: true,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
    index: true,
  })
  status!: 'pending' | 'processing' | 'completed' | 'failed';

  @IsNumber()
  @Min(0)
  @Prop({ required: true, min: 0, default: 0 })
  attempts!: number;

  @IsNumber()
  @Min(1)
  @Prop({ required: true, min: 1, default: 3 })
  maxAttempts!: number;

  @IsOptional()
  @IsDate()
  @Prop()
  lastAttemptAt?: Date;

  @IsOptional()
  @IsString()
  @Prop()
  errorMessage?: string;

  @IsDate()
  @Prop()
  createdAt!: Date;

  @IsDate()
  @Prop()
  updatedAt!: Date;
}

export const ReminderJobSchema = SchemaFactory.createForClass(ReminderJob);

// Create compound indexes for performance
ReminderJobSchema.index({ reminderId: 1 }, { unique: true });
ReminderJobSchema.index({ status: 1, scheduledFor: 1 });
ReminderJobSchema.index({ status: 1, attempts: 1 });

// Index for job processing queries
ReminderJobSchema.index({
  status: 1,
  scheduledFor: 1,
  attempts: 1,
});

// Index for cleanup operations
ReminderJobSchema.index({
  status: 1,
  createdAt: 1,
});
