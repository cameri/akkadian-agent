import { HttpModule, HttpModuleOptions } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as http from 'node:http';
import * as https from 'node:https';
import {
  TELEGRAM_ADMIN_LIST,
  TELEGRAM_USER_WHITELIST,
} from './telegram.constants';
import { TelegramServer } from './telegram.server';

@Module({
  imports: [
    HttpModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): HttpModuleOptions => {
        const server = configService.get<string>('TELEGRAM_SERVER');
        const token = configService.get<string>('TELEGRAM_BOT_TOKEN');
        const baseURL = new URL(`/bot${token}`, server);

        const config: HttpModuleOptions = {
          baseURL: baseURL.toString(),
          headers: {
            'Content-Type': 'application/json',
          },
          responseType: 'json',
          timeout: 5000,
          maxRedirects: 0,
        };

        if (baseURL.protocol === 'https:') {
          config.httpsAgent = new https.Agent({
            keepAlive: true,
          });
        } else {
          config.httpAgent = new http.Agent({
            keepAlive: true,
          });
        }

        return config;
      },
    }),
  ],
  providers: [
    {
      provide: TELEGRAM_USER_WHITELIST,
      inject: [ConfigService],
      useFactory(configService: ConfigService): Set<number> {
        const value = configService.get<string>(
          TELEGRAM_USER_WHITELIST.description!,
          '',
        );

        const userIds = value.split(/\D+/).map(Number.parseInt);

        return new Set(userIds);
      },
    },
    {
      provide: TELEGRAM_ADMIN_LIST,
      inject: [ConfigService],
      useFactory(configService: ConfigService): Set<number> {
        const value =
          configService.get<string>(TELEGRAM_ADMIN_LIST.description!) ?? '';

        const userIds = value.split(/\D+/).map(Number);

        return new Set(userIds);
      },
    },
    TelegramServer,
  ],
})
export class TelegramModule {}
