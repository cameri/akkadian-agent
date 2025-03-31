import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import pino, { BaseLogger } from 'pino';
import { PinoLoggerService } from './pino-logger.service';

@Module({
  providers: [
    {
      provide: 'Pino',
      inject: [ConfigService],
      useFactory: (configService: ConfigService): BaseLogger => {
        const level = configService.get<string>('LOG_LEVEL') || 'info';
        const app = configService.get<string>('APP_NAME') || 'akkadian-agent';
        const format = configService.get<string>('LOG_FORMAT');

        // const transport =
        //   format === 'pretty'
        //     ? {
        //         target: 'pino-pretty',
        //         options: {
        //           colorize: true,
        //           ignore: 'host,app,pid',
        //           singleLine: true,
        //         },
        //       }
        //     : undefined;

        return pino({
          level,
          // transport,
          formatters: {
            bindings: ({
              pid,
              hostname: host,
            }: {
              pid: number;
              hostname: string;
            }) => ({ pid, host, app }),
            level: (label) => {
              return { level: label.toUpperCase() };
            },
          },
          timestamp: pino.stdTimeFunctions.isoTime,
        });
      },
    },
    PinoLoggerService,
  ],
  exports: [PinoLoggerService],
})
export class LoggingModule {}
