import { Query } from '@nestjs/cqrs';
import type {
  ListRemindersQueryArgs,
  ListRemindersQueryResult,
} from '../reminders.types';

export class ListRemindersQuery extends Query<ListRemindersQueryResult> {
  constructor(private readonly args: ListRemindersQueryArgs) {
    super();
  }

  get userId(): string {
    return this.args.userId;
  }

  get chatId(): string | undefined {
    return this.args.chatId;
  }

  get status(): string | undefined {
    return this.args.status;
  }

  get limit(): number | undefined {
    return this.args.limit;
  }

  get offset(): number | undefined {
    return this.args.offset;
  }
}
