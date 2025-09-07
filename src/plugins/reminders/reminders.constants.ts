export const RemindersCollectionName = 'reminders';
export const ReminderJobsCollectionName = 'reminder-jobs';

export const REMINDER_CACHE_PREFIX = 'reminder:';
export const USER_REMINDERS_CACHE_PREFIX = 'user-reminders:';
export const UPCOMING_REMINDERS_CACHE_PREFIX = 'upcoming-reminders:';

// Limits
export const MAX_REMINDERS_PER_USER = 100;
export const MAX_REMINDER_MESSAGE_LENGTH = 500;
export const MAX_TITLE_LENGTH = 100;

// Scheduling constants
export const REMINDER_CHECK_INTERVAL = 60000; // 1 minute in milliseconds
export const REMINDER_EXECUTION_GRACE_PERIOD = 300000; // 5 minutes in milliseconds
export const CLEANUP_CRON_PATTERN = '0 2 * * *'; // Daily at 2 AM
export const REMINDER_CHECK_CRON_PATTERN = '*/1 * * * *'; // Every minute

// Cache TTL
export const REMINDER_CACHE_TTL = 3600; // 1 hour in seconds
export const USER_REMINDERS_CACHE_TTL = 1800; // 30 minutes in seconds

// Default timezone
export const DEFAULT_TIMEZONE = 'America/New_York';

// Response templates
export const RESPONSE_TEMPLATES = {
  REMINDER_CREATED: 'Reminder "{title}" set for {scheduledFor}',
  REMINDER_CANCELLED: 'Reminder "{title}" has been cancelled',
  REMINDER_NOT_FOUND:
    "Reminder not found or you don't have permission to access it",
  REMINDER_LIMIT_EXCEEDED: `You can only have up to ${MAX_REMINDERS_PER_USER} active reminders`,
  INVALID_DATE_FORMAT:
    'I couldn\'t understand the date/time format. Please try something like "tomorrow at 3pm" or "in 2 hours"',
  PAST_DATE_ERROR: 'Cannot create reminders for past dates',
  STORAGE_ERROR:
    "Sorry, I couldn't save your reminder right now. Please try again later",
  NO_REMINDERS: "You don't have any active reminders",
  TIMEZONE_SET: 'Your timezone has been set to {timezone}',
  INVALID_TIMEZONE:
    'Invalid timezone. Please use a valid timezone like "America/New_York" or "Europe/London"',
  PERMISSION_DENIED: "You don't have permission to perform this action",
  DELIVERY_FAILED: 'Failed to deliver reminder "{title}" to user {userId}',
  REMINDER_DELIVERED: 'Reminder: {title}\n{message}',
} as const;

// Reminder statuses
export const REMINDER_STATUS = {
  PENDING: 'pending',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
} as const;

// Priority levels
export const REMINDER_PRIORITY = {
  LOW: 1,
  NORMAL: 2,
  HIGH: 3,
  URGENT: 4,
} as const;

// Recurrence patterns
export const RECURRENCE_PATTERN = {
  NONE: 'none',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
} as const;
