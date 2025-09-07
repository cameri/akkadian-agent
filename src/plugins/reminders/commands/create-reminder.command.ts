import { Command } from '@nestjs/cqrs';
import type {
  CreateReminderCommandArgs,
  CreateReminderCommandResult,
} from '../reminders.types';

export class CreateReminderCommand extends Command<CreateReminderCommandResult> {
  constructor(private readonly args: CreateReminderCommandArgs) {
    super();
  }

  get userId(): string {
    return this.args.userId;
  }

  get chatId(): string {
    return this.args.chatId;
  }

  get title(): string {
    return this.args.title;
  }

  get message(): string | undefined {
    return this.args.message;
  }

  get dateTimeText(): string {
    return this.args.dateTimeText;
  }

  get timezone(): string | undefined {
    return this.args.timezone;
  }

  get priority(): number | undefined {
    return this.args.priority;
  }

  get recurrence(): string | undefined {
    return this.args.recurrence;
  }

  get transport(): string {
    return this.args.transport;
  }

  get transportSpecific(): Record<string, unknown> | undefined {
    return this.args.transportSpecific;
  }
}
