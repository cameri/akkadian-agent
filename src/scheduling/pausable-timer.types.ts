import { Observable } from 'rxjs';

/**
 * Interface for a timer that can be paused and resumed.
 */
export interface IPausableTimer {
  /**
   * Starts the timer with the provided parameters
   * @param dueTimeMs - Initial delay before first tick in milliseconds
   * @param intervalMs - Interval between ticks in milliseconds
   * @param maxCount - Maximum number of ticks before auto-pausing (defaults to Number.POSITIVE_INFINITY)
   */
  start(dueTimeMs?: number, intervalMs?: number, maxCount?: number): void;

  /**
   * Pauses the timer
   */
  pause(): void;

  /**
   * Resumes the timer if it hasn't reached maxCount
   */
  resume(): void;

  /**
   * Emits a single tick after the specified delay
   * @param dueTimeMs - Delay before the tick in milliseconds
   */
  oneShot(dueTimeMs?: number): void;

  /**
   * Closes the timer and cleans up resources
   */
  close(): void;

  /**
   * Sets the maximum number of ticks before auto-pausing
   * @param maxCount - Maximum tick count (defaults to Number.POSITIVE_INFINITY)
   */
  setMaxCount(maxCount?: number): void;

  /**
   * Observable that emits timer ticks
   */
  readonly ticks$: Observable<number>;
}
