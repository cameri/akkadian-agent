import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { DatabaseModule } from './database/database.module';
import { InstrumentationModule } from './instrumentation/instrumentation.module';
import { SimpleRepliesModule } from './simple-replies/simple-replies.module';
import { TelegramModule } from './transports/telegram/telegram.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
    }),
    InstrumentationModule,
    DatabaseModule,
    CqrsModule.forRoot(),
    TelegramModule,
    SimpleRepliesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
