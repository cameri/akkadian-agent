import { IWorld } from '@cucumber/cucumber';
import { INestApplication } from '@nestjs/common';
import { nock } from './http-request-interceptor';

export type TestWorld = IWorld & {
  app: INestApplication;
  telegramScope: nock.Scope;
};
