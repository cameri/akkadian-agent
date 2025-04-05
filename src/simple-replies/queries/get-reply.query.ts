import { IQuery } from '@nestjs/cqrs';

export class GetReplyQuery implements IQuery {
  constructor(public readonly pattern: string) {}
}
