import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { PinoLoggerService } from './instrumentation/logging/pino-logger.service';
import { TelegramServer } from './transports/telegram/telegram.server';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.enableShutdownHooks();

  const logger = app.get(PinoLoggerService);

  app.useLogger(logger);

  const strategy = app.get(TelegramServer);

  app.connectMicroservice<MicroserviceOptions>(
    {
      strategy,
    },
    {
      inheritAppConfig: true,
    },
  );

  await app.startAllMicroservices();

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
