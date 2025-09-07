import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { HydratedDocument } from 'mongoose';
import type {
  IReminder,
  ReminderStatus,
  ReminderPriority,
  RecurrencePattern,
} from '../reminders.types';
import {
  RemindersCollectionName,
  REMINDER_STATUS,
  REMINDER_PRIORITY,
  RECURRENCE_PATTERN,
  MAX_REMINDER_MESSAGE_LENGTH,
  MAX_TITLE_LENGTH,
} from '../reminders.constants';

export type ReminderDocument = HydratedDocument<Reminder>;

@Schema({
  timestamps: true, // Automatically adds `createdAt` and `updatedAt`
  collection: RemindersCollectionName,
})
export class Reminder implements IReminder {
  @IsString()
  @Prop({ required: true, index: true })
  userId!: string;

  @IsString()
  @Prop({ required: true, index: true })
  chatId!: string;

  @IsString()
  @MaxLength(MAX_TITLE_LENGTH)
  @Prop({ required: true })
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_REMINDER_MESSAGE_LENGTH)
  @Prop()
  message?: string;

  @IsDate()
  @Prop({ required: true, index: true })
  scheduledFor!: Date;

  @IsString()
  @Prop({ required: true, default: 'UTC' })
  timezone!: string;

  @IsEnum(REMINDER_STATUS)
  @Prop({
    required: true,
    enum: Object.values(REMINDER_STATUS),
    default: REMINDER_STATUS.PENDING,
    index: true,
  })
  status!: ReminderStatus;

  @IsNumber()
  @Min(1)
  @Max(4)
  @Prop({
    required: true,
    min: 1,
    max: 4,
    default: REMINDER_PRIORITY.NORMAL,
  })
  priority!: ReminderPriority;

  @IsEnum(RECURRENCE_PATTERN)
  @Prop({
    required: true,
    enum: Object.values(RECURRENCE_PATTERN),
    default: RECURRENCE_PATTERN.NONE,
  })
  recurrence!: RecurrencePattern;

  @IsOptional()
  @IsDate()
  @Prop({ index: true })
  nextOccurrence?: Date;

  @IsString()
  @Prop({ required: true, index: true })
  transport!: string;

  @IsOptional()
  @Prop({ type: Object })
  transportSpecific?: Record<string, unknown>;

  @IsDate()
  @Prop()
  createdAt!: Date;

  @IsDate()
  @Prop()
  updatedAt!: Date;

  @IsOptional()
  @IsDate()
  @Prop({ index: true })
  deletedAt?: Date;
}

export const ReminderSchema = SchemaFactory.createForClass(Reminder);

// Create compound indexes for performance
ReminderSchema.index({ userId: 1, status: 1 });
ReminderSchema.index({ userId: 1, scheduledFor: 1 });
ReminderSchema.index({ chatId: 1, status: 1 });
ReminderSchema.index({ status: 1, scheduledFor: 1 });
ReminderSchema.index({ transport: 1, status: 1 });
ReminderSchema.index({ deletedAt: 1 });

// Index for upcoming reminders query
ReminderSchema.index({
  status: 1,
  scheduledFor: 1,
  deletedAt: 1,
});

// Partial index for active reminders only
ReminderSchema.index(
  { userId: 1, createdAt: -1 },
  { partialFilterExpression: { deletedAt: { $exists: false } } },
);

// Text index for search functionality
ReminderSchema.index(
  {
    title: 'text',
    message: 'text',
  },
  {
    name: 'reminder_text_index',
  },
);
