import { Query } from '@nestjs/cqrs';
import type {
  GetReminderQueryArgs,
  GetReminderQueryResult,
} from '../reminders.types';

export class GetReminderQuery extends Query<GetReminderQueryResult> {
  constructor(private readonly args: GetReminderQueryArgs) {
    super();
  }

  get reminderId(): string {
    return this.args.reminderId;
  }

  get userId(): string {
    return this.args.userId;
  }
}
