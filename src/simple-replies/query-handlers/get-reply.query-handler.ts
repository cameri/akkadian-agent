import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { SimpleReply } from '../models/simple-reply.model';
import { GetReplyQuery } from '../queries/get-reply.query';
import { SimpleRepliesRepository } from '../simple-replies.repository';

@QueryHandler(GetReplyQuery)
export class GetReplyQueryHandler
  implements IQueryHandler<GetReplyQuery, SimpleReply | null>
{
  constructor(private readonly repository: SimpleRepliesRepository) {}

  execute(query: GetReplyQuery): Promise<SimpleReply | null> {
    return this.repository.findOneByPattern(query.pattern);
  }
}
