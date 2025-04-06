import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseModule } from '../database/database.module';
import { InstrumentationModule } from '../instrumentation/instrumentation.module';
import { AddReplyCommandHandler } from './command-handlers/add-reply.command-handler';
import { RemoveReplyCommandHandler } from './command-handlers/remove-reply.command-handler';
import { GetReplyQueryHandler } from './query-handlers/get-reply.query-handler';
import { Reply, ReplySchema } from './schemas/reply.schema';
import { SimpleRepliesController } from './simple-replies.controller';
import { ReplyRepository } from './simple-replies.repository';

@Module({
  imports: [
    InstrumentationModule,
    DatabaseModule,
    MongooseModule.forFeature([{ name: Reply.name, schema: ReplySchema }]),
  ],
  providers: [
    ReplyRepository,
    AddReplyCommandHandler,
    RemoveReplyCommandHandler,
    GetReplyQueryHandler,
  ],
  controllers: [SimpleRepliesController],
})
export class SimpleRepliesModule {}
