import { Injectable } from '@nestjs/common';
import {
  BehaviorSubject,
  EMPTY,
  Subject,
  Subscription,
  switchMap,
  take,
  takeUntil,
  timer,
} from 'rxjs';
import { IPausableTimer } from './pausable-timer.types';

@Injectable()
export class PausableTimer implements IPausableTimer {
  private isRunning$ = new BehaviorSubject<boolean>(false);
  private destroy$ = new Subject<void>();
  private intervalSubscription?: Subscription;
  private tickSubject = new Subject<number>();

  private dueTime: number;
  private intervalMs: number;
  private maxCount: number;
  private currentCount = 0;

  constructor(
    dueTime: number = 0,
    intervalMs: number,
    maxCount: number = Number.POSITIVE_INFINITY,
  ) {
    this.dueTime = Math.abs(dueTime);
    this.intervalMs = intervalMs;
    this.maxCount = maxCount;

    if (dueTime >= 0) {
      this.start(this.dueTime, this.intervalMs);
    }
  }

  start(
    dueTimeMs: number = 0,
    intervalMs: number = this.intervalMs,
    maxCount: number = this.maxCount,
  ): void {
    this.dueTime = dueTimeMs;
    this.intervalMs = intervalMs;
    this.maxCount = maxCount;
    this.currentCount = 0;

    this.cleanup();

    const timerObservable = this.isRunning$.pipe(
      switchMap((isRunning) => {
        if (!isRunning) {
          return EMPTY;
        }

        return timer(this.dueTime, this.intervalMs).pipe(take(this.maxCount));
      }),
      takeUntil(this.destroy$),
    );

    this.intervalSubscription = timerObservable.subscribe((val) => {
      this.currentCount++;
      this.tickSubject.next(val);

      // If we've reached the maximum count, automatically pause
      if (this.currentCount >= this.maxCount) {
        this.pause();
      }
    });

    this.resume();
  }

  pause(): void {
    this.isRunning$.next(false);
  }

  resume(): void {
    // If we've already hit maxCount, don't resume
    if (this.currentCount >= this.maxCount) {
      return;
    }

    this.isRunning$.next(true);
  }

  oneShot(dueTimeMs: number = 0): void {
    timer(dueTimeMs)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.tickSubject.next(0);
      });
  }

  close(): void {
    this.pause();
    this.destroy$.next();
    this.destroy$.complete();
    this.cleanup();
  }

  private cleanup(): void {
    if (this.intervalSubscription) {
      this.intervalSubscription.unsubscribe();
      this.intervalSubscription = undefined;
    }
  }

  setMaxCount(maxCount: number = Number.POSITIVE_INFINITY): void {
    this.maxCount = maxCount;

    // If we're already past the new max count, pause immediately
    if (this.currentCount >= maxCount) {
      this.pause();
      return;
    }

    // If the timer is running, restart it with the new maxCount
    if (this.isRunning$.value) {
      this.start(this.dueTime, this.intervalMs);
    }
  }

  public readonly ticks$ = this.tickSubject.asObservable();
}
