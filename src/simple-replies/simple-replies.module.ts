import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseModule } from '../database/database.module';
import { InstrumentationModule } from '../instrumentation/instrumentation.module';
import { AddReplyCommandHandler } from './command-handlers/add-reply.command-handler';
import { RemoveReplyCommandHandler } from './command-handlers/remove-reply.command-handler';
import { SimpleReply, SimpleReplySchema } from './models/simple-reply.model';
import { GetReplyQueryHandler } from './query-handlers/get-reply.query-handler';
import { SimpleRepliesController } from './simple-replies.controller';
import { SimpleRepliesRepository } from './simple-replies.repository';

@Module({
  imports: [
    InstrumentationModule,
    DatabaseModule,
    MongooseModule.forFeature([
      { name: SimpleReply.name, schema: SimpleReplySchema },
    ]),
  ],
  providers: [
    // {
    //   provide: SimpleReply,
    //   inject: [DatabaseConnection],
    //   useFactory: (connection: Connection) =>
    //     getModelForClass(SimpleReply, { existingConnection: connection }),
    // },

    SimpleRepliesRepository,
    AddReplyCommandHandler,
    RemoveReplyCommandHandler,
    GetReplyQueryHandler,
  ],
  controllers: [SimpleRepliesController],
})
export class SimpleRepliesModule {}
