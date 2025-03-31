import { Logger, Module } from '@nestjs/common';
import { LoggingModule } from './logging/logging.module';
import { PinoLoggerService } from './logging/pino-logger.service';

@Module({
  imports: [LoggingModule],
  providers: [
    {
      provide: Logger,
      useExisting: PinoLoggerService,
    },
  ],
  exports: [Logger],
})
export class InstrumentationModule {}
