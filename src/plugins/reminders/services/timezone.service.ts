import { Injectable, Logger } from '@nestjs/common';
import { DateTime, IANAZone } from 'luxon';
import { CacheService } from '../../../cache';
import { DEFAULT_TIMEZONE } from '../reminders.constants';

@Injectable()
export class TimezoneService {
  private readonly logger = new Logger(TimezoneService.name);
  private readonly cachePrefix = 'user-timezone:';
  private readonly cacheTtl = 86400; // 24 hours

  constructor(private readonly cacheService: CacheService) {}

  /**
   * Gets user's timezone setting, returns default if not set
   */
  async getUserTimezone(userId: string, _chatId?: string): Promise<string> {
    try {
      const cacheKey = `${this.cachePrefix}${userId}`;

      // Try to get from cache first
      const cachedTimezone = await this.cacheService.get<string>(cacheKey);
      if (cachedTimezone) {
        return cachedTimezone;
      }

      // For now, we'll use in-memory storage via cache
      // In a full implementation, this would query a database
      return DEFAULT_TIMEZONE;
    } catch (error) {
      this.logger.error(`Error getting timezone for user ${userId}:`, error);
      return DEFAULT_TIMEZONE;
    }
  }

  /**
   * Sets user's timezone preference
   */
  async setUserTimezone(
    userId: string,
    chatId: string,
    timezone: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.isValidTimezone(timezone)) {
        return {
          success: false,
          error:
            'Invalid timezone. Please use a valid IANA timezone like "America/New_York" or "Europe/London"',
        };
      }

      const cacheKey = `${this.cachePrefix}${userId}`;
      await this.cacheService.set(cacheKey, timezone, this.cacheTtl);

      this.logger.debug(`Set timezone for user ${userId} to ${timezone}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Error setting timezone for user ${userId}:`, error);
      return {
        success: false,
        error: 'Failed to save timezone setting. Please try again later.',
      };
    }
  }

  /**
   * Validates if a timezone string is a valid IANA timezone
   */
  isValidTimezone(timezone: string): boolean {
    try {
      // Use Luxon's IANAZone to validate
      const zone = new IANAZone(timezone);
      return zone.isValid;
    } catch {
      return false;
    }
  }

  /**
   * Gets a list of common timezones grouped by region
   */
  getCommonTimezones(): Record<string, string[]> {
    return {
      'North America': [
        'America/New_York',
        'America/Chicago',
        'America/Denver',
        'America/Los_Angeles',
        'America/Toronto',
        'America/Vancouver',
        'America/Mexico_City',
      ],
      Europe: [
        'Europe/London',
        'Europe/Paris',
        'Europe/Berlin',
        'Europe/Rome',
        'Europe/Madrid',
        'Europe/Amsterdam',
        'Europe/Stockholm',
        'Europe/Moscow',
      ],
      Asia: [
        'Asia/Tokyo',
        'Asia/Shanghai',
        'Asia/Hong_Kong',
        'Asia/Singapore',
        'Asia/Seoul',
        'Asia/Bangkok',
        'Asia/Dubai',
        'Asia/Kolkata',
      ],
      Australia: [
        'Australia/Sydney',
        'Australia/Melbourne',
        'Australia/Perth',
        'Australia/Brisbane',
        'Australia/Adelaide',
      ],
      Other: [
        'UTC',
        'GMT',
        'Pacific/Auckland',
        'Africa/Cairo',
        'America/Sao_Paulo',
        'America/Buenos_Aires',
      ],
    };
  }

  /**
   * Suggests timezone based on text input (fuzzy matching)
   */
  suggestTimezone(input: string): string[] {
    const lowercaseInput = input.toLowerCase();
    const allTimezones = Object.values(this.getCommonTimezones()).flat();

    return allTimezones
      .filter(
        (tz) =>
          tz.toLowerCase().includes(lowercaseInput) ||
          this.getTimezoneDisplayName(tz)
            .toLowerCase()
            .includes(lowercaseInput),
      )
      .slice(0, 5); // Limit to 5 suggestions
  }

  /**
   * Gets a human-readable display name for a timezone
   */
  getTimezoneDisplayName(timezone: string): string {
    try {
      const now = DateTime.now().setZone(timezone);
      const offsetString = now.toFormat('ZZ');
      const cityName =
        timezone.split('/').pop()?.replace(/_/g, ' ') || timezone;

      return `${cityName} (UTC${offsetString})`;
    } catch {
      return timezone;
    }
  }

  /**
   * Gets current time in user's timezone
   */
  async getCurrentTimeForUser(userId: string): Promise<DateTime> {
    const userTimezone = await this.getUserTimezone(userId);
    return DateTime.now().setZone(userTimezone);
  }

  /**
   * Converts a date to user's timezone
   */
  async convertToUserTimezone(userId: string, date: Date): Promise<DateTime> {
    const userTimezone = await this.getUserTimezone(userId);
    return DateTime.fromJSDate(date).setZone(userTimezone);
  }

  /**
   * Gets timezone offset information
   */
  getTimezoneInfo(timezone: string): {
    name: string;
    offset: string;
    abbreviation: string;
    isValid: boolean;
  } {
    try {
      const dt = DateTime.now().setZone(timezone);

      return {
        name: timezone,
        offset: dt.toFormat('ZZ'),
        abbreviation: dt.toFormat('ZZZZ'),
        isValid: dt.isValid,
      };
    } catch {
      return {
        name: timezone,
        offset: '+00:00',
        abbreviation: 'UTC',
        isValid: false,
      };
    }
  }

  /**
   * Checks if it's a reasonable time to send a reminder in user's timezone
   * (e.g., not too early in the morning or too late at night)
   */
  async isReasonableTimeForReminder(
    userId: string,
    date?: Date,
  ): Promise<boolean> {
    const userTime = date
      ? await this.convertToUserTimezone(userId, date)
      : await this.getCurrentTimeForUser(userId);

    const hour = userTime.hour;

    // Consider 6 AM to 11 PM as reasonable hours
    return hour >= 6 && hour <= 23;
  }

  /**
   * Adjusts reminder time to a more reasonable hour if needed
   */
  async adjustToReasonableTime(userId: string, date: Date): Promise<Date> {
    const userTime = await this.convertToUserTimezone(userId, date);
    const hour = userTime.hour;

    // If it's between 11 PM and 6 AM, move to 9 AM the next day
    if (hour >= 23 || hour < 6) {
      const adjustedTime = userTime
        .startOf('day')
        .plus({ days: hour < 6 ? 0 : 1 })
        .set({ hour: 9, minute: 0, second: 0 });

      return adjustedTime.toJSDate();
    }

    return date;
  }
}
