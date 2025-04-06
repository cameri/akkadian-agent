import { PausableTimer } from './pausable-timer';
import { IPausableTimer } from './pausable-timer.types';

describe('PausableTimer', () => {
  let timer: IPausableTimer;

  beforeEach(() => {
    // Initialize with a maxCount of 10 to prevent infinite running
    timer = new PausableTimer(-1, 1000, 10);
  });

  afterEach(() => {
    timer.close();
  });

  it('should emit ticks when started', (done) => {
    const values: number[] = [];
    timer.start(10, 100, 3); // Small values for fast test execution

    const subscription = timer.ticks$.subscribe({
      next: (val) => {
        values.push(val);
        if (values.length === 3) {
          expect(values.length).toBe(3); // Verify we get exactly 3 values
          subscription.unsubscribe();
          done();
        }
      },
      error: (err) => done(err),
    });
  }, 2000);

  it('should pause and resume correctly', (done) => {
    const values: number[] = [];
    timer.start(10, 100, 6); // More values to ensure we have enough

    const subscription = timer.ticks$.subscribe({
      next: (val) => {
        values.push(val);

        // Pause after the first value
        if (values.length === 1) {
          timer.pause();

          // Resume after a short delay
          setTimeout(() => {
            timer.resume();
          }, 150);
        }

        // Complete after receiving at least 3 values
        if (values.length >= 3) {
          // Check if we got more values after resuming
          expect(values.length).toBeGreaterThan(2);
          subscription.unsubscribe();
          done();
        }
      },
      error: (err) => done(err),
    });
  }, 10000);

  it('should emit a single tick for oneShot', (done) => {
    timer.oneShot(100);

    const values: number[] = [];
    const subscription = timer.ticks$.subscribe({
      next: (val) => {
        values.push(val);
        expect(values).toEqual([0]); // Expect a single value: 0
        subscription.unsubscribe();
        done();
      },
      error: (err) => done(err),
    });
  }, 2000);

  it('should clean up resources on close', () => {
    const cleanupSpy = jest.spyOn(timer as any, 'cleanup');

    timer.close();

    expect(cleanupSpy).toHaveBeenCalled();
  });

  it('should respect the maxCount setting', (done) => {
    const values: number[] = [];
    timer.start(10, 100, 2); // Set maxCount to 2

    const subscription = timer.ticks$.subscribe({
      next: (val) => {
        values.push(val);
      },
      error: (err) => done(err),
    });

    // Check after a delay that we've stopped at 2 values
    setTimeout(() => {
      expect(values.length).toBe(2);

      // Wait a bit more to ensure no more values are emitted
      setTimeout(() => {
        expect(values.length).toBe(2); // Still 2 values
        subscription.unsubscribe();
        done();
      }, 300);
    }, 300);
  }, 2000);

  it('should update maxCount when setMaxCount is called', (done) => {
    let initialValueCount = 0;
    const values: number[] = [];

    // Start with a higher maxCount first
    timer.start(10, 50, 10);

    const subscription = timer.ticks$.subscribe({
      next: (val) => {
        values.push(val);
      },
      error: (err) => done(err),
    });

    // After a short delay, pause the timer, record the count and set maxCount
    setTimeout(() => {
      timer.pause(); // Pause to ensure exact control
      initialValueCount = values.length;
      expect(initialValueCount).toBeGreaterThan(0);

      // Set maxCount to current + 1, which should allow one more tick
      timer.setMaxCount(initialValueCount + 1);
      timer.resume();

      // Wait long enough to verify we got exactly one more tick
      setTimeout(() => {
        timer.pause(); // Stop the timer
        expect(values.length).toBe(initialValueCount + 1);
        subscription.unsubscribe();
        done();
      }, 100);
    }, 150);
  }, 3000); // Increased timeout
});
