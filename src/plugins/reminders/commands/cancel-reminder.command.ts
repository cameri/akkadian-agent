import { Command } from '@nestjs/cqrs';
import type {
  CancelReminderCommandArgs,
  CancelReminderCommandResult,
} from '../reminders.types';

export class CancelReminderCommand extends Command<CancelReminderCommandResult> {
  constructor(private readonly args: CancelReminderCommandArgs) {
    super();
  }

  get userId(): string {
    return this.args.userId;
  }

  get reminderId(): string {
    return this.args.reminderId;
  }
}
