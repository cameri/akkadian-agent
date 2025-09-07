import type { Document } from 'mongoose';

// Base interfaces
export type ReminderStatus = 'pending' | 'delivered' | 'cancelled' | 'failed';
export type ReminderPriority = 1 | 2 | 3 | 4; // LOW, NORMAL, HIGH, URGENT
export type RecurrencePattern =
  | 'none'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly';

// Core reminder interface
export interface IReminder {
  _id?: string;
  userId: string;
  chatId: string;
  title: string;
  message?: string;
  scheduledFor: Date;
  timezone: string;
  status: ReminderStatus;
  priority: ReminderPriority;
  recurrence: RecurrencePattern;
  nextOccurrence?: Date;
  transport: string; // 'telegram', 'nostr'
  transportSpecific?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// Reminder job tracking
export interface IReminderJob {
  reminderId: string;
  scheduledFor: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: Date;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Document types
export type ReminderDocument = IReminder & Document;
export type ReminderJobDocument = IReminderJob & Document;

// Command types
export interface CreateReminderCommandArgs {
  userId: string;
  chatId: string;
  title: string;
  message?: string;
  dateTimeText: string;
  timezone?: string;
  priority?: ReminderPriority;
  recurrence?: RecurrencePattern;
  transport: string;
  transportSpecific?: Record<string, unknown>;
}

export interface CreateReminderCommandResult {
  success: boolean;
  reminder?: IReminder;
  message?: string;
  error?: string;
}

export interface CancelReminderCommandArgs {
  userId: string;
  reminderId: string;
}

export interface CancelReminderCommandResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface SetTimezoneCommandArgs {
  userId: string;
  chatId: string;
  timezone: string;
}

export interface SetTimezoneCommandResult {
  success: boolean;
  message?: string;
  error?: string;
}

// Query types
export interface ListRemindersQueryArgs {
  userId: string;
  chatId?: string;
  status?: ReminderStatus;
  limit?: number;
  offset?: number;
}

export interface ListRemindersQueryResult {
  reminders: IReminder[];
  total: number;
  hasMore: boolean;
}

export interface GetReminderQueryArgs {
  reminderId: string;
  userId: string;
}

export interface GetReminderQueryResult {
  reminder: IReminder | null;
}

export interface GetUpcomingRemindersQueryArgs {
  fromDate: Date;
  toDate: Date;
  limit?: number;
}

export interface GetUpcomingRemindersQueryResult {
  reminders: IReminder[];
  total: number;
}

// Service types
export interface ParsedDateTime {
  date: Date;
  confidence: number;
  originalText: string;
  timezone?: string;
}

export interface UserTimezoneSettings {
  userId: string;
  chatId: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

// Event payload types (the events themselves are in ./events/)
export interface ReminderCreatedEventPayload {
  reminder: IReminder;
  userId: string;
  chatId: string;
}

export interface ReminderDeliveredEventPayload {
  reminder: IReminder;
  deliveredAt: Date;
  transport: string;
}

export interface ReminderFailedEventPayload {
  reminder: IReminder;
  error: string;
  attempts: number;
}

export interface ReminderCancelledEventPayload {
  reminder: IReminder;
  cancelledBy: string;
  cancelledAt: Date;
}

// Cache types
export interface CachedReminder extends IReminder {
  cacheKey: string;
  cachedAt: Date;
}

export interface CachedUserReminders {
  userId: string;
  reminders: IReminder[];
  total: number;
  cachedAt: Date;
}
