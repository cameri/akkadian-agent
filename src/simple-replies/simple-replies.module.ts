import { Module } from '@nestjs/common';
import { getModelForClass } from '@typegoose/typegoose';
import { Connection } from 'mongoose';
import { DatabaseConnection } from '../database/database.constants';
import { DatabaseModule } from '../database/database.module';
import { InstrumentationModule } from '../instrumentation/instrumentation.module';
import { AddReplyCommandHandler } from './command-handlers/add-reply.command-handler';
import { RemoveReplyCommandHandler } from './command-handlers/remove-reply.command-handler';
import { SimpleReply } from './models/simple-reply.model';
import { SimpleRepliesController } from './simple-replies.controller';
import { SimpleRepliesRepository } from './simple-replies.repository';

@Module({
  imports: [DatabaseModule, InstrumentationModule],
  providers: [
    {
      provide: SimpleReply,
      inject: [DatabaseConnection],
      useFactory: (connection: Connection) =>
        getModelForClass(SimpleReply, { existingConnection: connection }),
    },
    SimpleRepliesRepository,
    AddReplyCommandHandler,
    RemoveReplyCommandHandler,
  ],
  controllers: [SimpleRepliesController],
})
export class SimpleRepliesModule {}
