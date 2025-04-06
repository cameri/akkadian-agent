import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PausableTimer } from './pausable-timer';

interface PausableTimerOptions {
  interval?: number;
  dueTime?: number;
}

@Module({})
export class SchedulingModule {
  static forFeature(
    name: string | symbol,
    options:
      | PausableTimerOptions
      | ((configService: ConfigService) => PausableTimerOptions),
  ): DynamicModule {
    return {
      module: SchedulingModule,
      providers: [
        {
          provide: name,
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => {
            const opts =
              typeof options === 'function' ? options(configService) : options;

            opts.dueTime = opts.dueTime ?? 0;
            opts.interval = opts.interval ?? 5000;

            return new PausableTimer(opts.dueTime, opts.interval);
          },
        },
      ],
      exports: [
        {
          provide: name,
          useExisting: name,
        },
      ],
    };
  }
}
