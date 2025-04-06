import { Query } from '@nestjs/cqrs';
import {
  GetReplyQueryArgs,
  GetReplyQueryResult,
} from '../simple-replies.types';

export class GetReplyQuery extends Query<GetReplyQueryResult> {
  constructor(private readonly args: GetReplyQueryArgs) {
    super();
  }

  get pattern() {
    return this.args.pattern;
  }
}
