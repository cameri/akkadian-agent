import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { Logger } from 'pino';

@Injectable()
export class PinoLoggerService implements LoggerService {
  constructor(
    @Inject('Pino')
    private readonly logger: Logger,
  ) {}

  log(message: string, ...optionalParams: any[]) {
    this.logger.info({}, message, ...optionalParams);
  }

  error(message: string, ...optionalParams: any[]) {
    this.logger.error({}, message, ...optionalParams);
  }

  warn(message: string, ...optionalParams: any[]) {
    this.logger.warn({}, message, ...optionalParams);
  }

  debug?(message: string, ...optionalParams: any[]) {
    this.logger.debug({}, message, ...optionalParams);
  }

  verbose?(message: string, ...optionalParams: any[]) {
    this.logger.trace({}, message, ...optionalParams);
  }

  fatal?(message: string, ...optionalParams: any[]) {
    this.logger.fatal({}, message, ...optionalParams);
  }
}
