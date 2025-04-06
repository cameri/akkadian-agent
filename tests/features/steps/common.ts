import { After, AfterAll, Before, BeforeAll } from '@cucumber/cucumber';
import { MicroserviceOptions } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import {
  MongoDBContainer,
  StartedMongoDBContainer,
} from '@testcontainers/mongodb';
import { AppModule } from '../../../src/app.module';
import { PinoLoggerService } from '../../../src/instrumentation/logging/pino-logger.service';
import { TelegramServer } from '../../../src/transports/telegram/telegram.server';
import {
  TELEGRAM_ADMIN_LIST,
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_SERVER,
  TELEGRAM_USER_WHITELIST,
} from './constants';
import { nock } from './http-request-interceptor';
import { TestWorld } from './types';

let mongoContainer: StartedMongoDBContainer;

BeforeAll({ timeout: 30000 }, async function (this: TestWorld) {
  try {
    if (nock.isActive()) {
      nock.restore();
    }

    mongoContainer = await new MongoDBContainer(
      'mongodb/mongodb-community-server:8.0.3-ubi8',
    ).start();
  } catch (error) {
    console.error('Did you forget to start Docker?', error);

    throw error;
  }
});

Before(async function (this: TestWorld) {
  nock.activate();

  process.env.LOG_LEVEL = 'debug';

  const connectionString = `${mongoContainer.getConnectionString()}?directConnection=true`;
  process.env.MONGODB_URI = connectionString;

  process.env.TELEGRAM_SERVER = TELEGRAM_SERVER;
  process.env.TELEGRAM_BOT_TOKEN = TELEGRAM_BOT_TOKEN;
  process.env.TELEGRAM_USER_WHITELIST = TELEGRAM_USER_WHITELIST;
  process.env.TELEGRAM_ADMIN_LIST = TELEGRAM_ADMIN_LIST;

  const telegramApiBaseUrl = new URL(
    `/bot${TELEGRAM_BOT_TOKEN}`,
    TELEGRAM_SERVER,
  );
  this.telegramScope = nock(telegramApiBaseUrl).persist();
  //.filteringPath(/bot[^/]+/g, 'bot-token');

  console.time('Compiling app');
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  console.timeEnd('Compiling app');

  console.time('Creating app');
  this.app = moduleFixture.createNestApplication({
    bufferLogs: true,
    forceCloseConnections: true,
    abortOnError: false,
  });

  const logger = this.app.get(PinoLoggerService);

  this.app.useLogger(logger);

  const strategy = this.app.get(TelegramServer);

  this.app.connectMicroservice<MicroserviceOptions>({
    strategy,
  });

  await this.app.startAllMicroservices();

  await this.app.init();

  console.timeEnd('Creating app');
});

After(async function (this: TestWorld) {
  nock.restore();

  if (this.app) {
    await this.app.close();
  }

  nock.cleanAll();
});

AfterAll({ timeout: 10000 }, async function () {
  try {
    if (mongoContainer) {
      await mongoContainer.stop({ remove: true });
    }
  } catch (error) {
    console.log('err', error);
  } finally {
    console.log('done');
  }
});
