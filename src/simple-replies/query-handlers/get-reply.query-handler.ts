import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetReplyQuery } from '../queries/get-reply.query';
import { ReplyRepository } from '../simple-replies.repository';
import { GetReplyQueryResult } from '../simple-replies.types';

@QueryHandler(GetReplyQuery)
export class GetReplyQueryHandler implements IQueryHandler<GetReplyQuery> {
  constructor(private readonly repository: ReplyRepository) {}

  async execute(query: GetReplyQuery): Promise<GetReplyQueryResult> {
    const simpleReply = await this.repository.findOneByPattern(query.pattern);

    return {
      result: simpleReply,
    };
  }
}
