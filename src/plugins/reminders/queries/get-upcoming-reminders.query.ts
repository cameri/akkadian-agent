import { Query } from '@nestjs/cqrs';
import type {
  GetUpcomingRemindersQueryArgs,
  GetUpcomingRemindersQueryResult,
} from '../reminders.types';

export class GetUpcomingRemindersQuery extends Query<GetUpcomingRemindersQueryResult> {
  constructor(private readonly args: GetUpcomingRemindersQueryArgs) {
    super();
  }

  get fromDate(): Date {
    return this.args.fromDate;
  }

  get toDate(): Date {
    return this.args.toDate;
  }

  get limit(): number | undefined {
    return this.args.limit;
  }
}
