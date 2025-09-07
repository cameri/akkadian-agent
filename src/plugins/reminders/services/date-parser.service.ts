import { Injectable, Logger } from '@nestjs/common';
import * as chrono from 'chrono-node';
import { DateTime } from 'luxon';
import type { ParsedDateTime } from '../reminders.types';
import { DEFAULT_TIMEZONE } from '../reminders.constants';

@Injectable()
export class DateParserService {
  private readonly logger = new Logger(DateParserService.name);

  /**
   * Parses natural language date/time text into a structured date object
   */
  parseDateTime(
    text: string,
    userTimezone: string = DEFAULT_TIMEZONE,
    referenceDate?: Date,
  ): ParsedDateTime | null {
    try {
      this.logger.debug(
        `Parsing date/time text: "${text}" with timezone: ${userTimezone}`,
      );

      const reference = referenceDate || new Date();

      // Use chrono-node to parse natural language dates
      const results = chrono.parse(text, reference);

      if (!results || results.length === 0) {
        this.logger.debug(`No date/time found in text: "${text}"`);
        return null;
      }

      // Get the first (most confident) result
      const result = results[0];
      const parsedDate = result.date();

      if (!parsedDate) {
        this.logger.debug(
          `Failed to extract date from parse result for: "${text}"`,
        );
        return null;
      }

      // Convert to user's timezone using Luxon
      const dateTime = DateTime.fromJSDate(parsedDate, { zone: userTimezone });

      if (!dateTime.isValid) {
        this.logger.warn(
          `Invalid date/time created from: "${text}" in timezone: ${userTimezone}`,
        );
        return null;
      }

      // Check if the parsed date is in the past
      const now = DateTime.now().setZone(userTimezone);
      if (dateTime < now) {
        this.logger.debug(
          `Parsed date is in the past: ${dateTime.toISO()} < ${now.toISO()}`,
        );
        return null;
      }

      const confidence = this.calculateConfidence(result, text);

      const parsed: ParsedDateTime = {
        date: dateTime.toJSDate(),
        confidence,
        originalText: text,
        timezone: userTimezone,
      };

      this.logger.debug(
        `Successfully parsed: "${text}" -> ${dateTime.toISO()} (confidence: ${confidence})`,
      );
      return parsed;
    } catch (error) {
      this.logger.error(`Error parsing date/time text: "${text}"`, error);
      return null;
    }
  }

  /**
   * Validates if a timezone string is valid
   */
  isValidTimezone(timezone: string): boolean {
    try {
      const dt = DateTime.now().setZone(timezone);
      return dt.isValid;
    } catch {
      return false;
    }
  }

  /**
   * Gets the current time in a specific timezone
   */
  getCurrentTime(timezone: string = DEFAULT_TIMEZONE): DateTime {
    return DateTime.now().setZone(timezone);
  }

  /**
   * Converts a date from one timezone to another
   */
  convertTimezone(date: Date, fromTimezone: string, toTimezone: string): Date {
    const fromDateTime = DateTime.fromJSDate(date, { zone: fromTimezone });
    const toDateTime = fromDateTime.setZone(toTimezone);
    return toDateTime.toJSDate();
  }

  /**
   * Formats a date for display in a specific timezone
   */
  formatDateTime(
    date: Date,
    timezone: string = DEFAULT_TIMEZONE,
    format?: string,
  ): string {
    const dt = DateTime.fromJSDate(date, { zone: timezone });

    if (format) {
      return dt.toFormat(format);
    }

    // Default friendly format
    return dt.toFormat("MMMM d, yyyy 'at' h:mm a ZZZZ");
  }

  /**
   * Calculates the next occurrence for recurring reminders
   */
  calculateNextOccurrence(
    currentDate: Date,
    recurrence: string,
    timezone: string = DEFAULT_TIMEZONE,
  ): Date | null {
    try {
      const dt = DateTime.fromJSDate(currentDate, { zone: timezone });

      switch (recurrence.toLowerCase()) {
        case 'daily':
          return dt.plus({ days: 1 }).toJSDate();

        case 'weekly':
          return dt.plus({ weeks: 1 }).toJSDate();

        case 'monthly':
          return dt.plus({ months: 1 }).toJSDate();

        case 'yearly':
          return dt.plus({ years: 1 }).toJSDate();

        default:
          return null;
      }
    } catch (error) {
      this.logger.error(
        `Error calculating next occurrence for recurrence: ${recurrence}`,
        error,
      );
      return null;
    }
  }

  /**
   * Checks if a date is within a reasonable future range (e.g., not more than 2 years)
   */
  isReasonableFutureDate(
    date: Date,
    timezone: string = DEFAULT_TIMEZONE,
  ): boolean {
    const dt = DateTime.fromJSDate(date, { zone: timezone });
    const now = DateTime.now().setZone(timezone);
    const twoYearsFromNow = now.plus({ years: 2 });

    return dt > now && dt <= twoYearsFromNow;
  }

  /**
   * Calculates confidence score based on chrono parsing result
   */
  private calculateConfidence(
    result: chrono.ParsedResult,
    originalText: string,
  ): number {
    let confidence = 0.8; // Base confidence

    // Higher confidence for more specific date components
    if (result.start.isCertain('year')) confidence += 0.1;
    if (result.start.isCertain('month')) confidence += 0.05;
    if (result.start.isCertain('day')) confidence += 0.05;
    if (result.start.isCertain('hour')) confidence += 0.05;
    if (result.start.isCertain('minute')) confidence += 0.02;

    // Lower confidence for ambiguous text
    const ambiguousWords = ['maybe', 'possibly', 'around', 'about', 'roughly'];
    if (
      ambiguousWords.some((word) => originalText.toLowerCase().includes(word))
    ) {
      confidence -= 0.2;
    }

    // Ensure confidence is within valid range
    return Math.max(0.1, Math.min(1.0, confidence));
  }
}
