import { Command } from '@nestjs/cqrs';
import type {
  SetTimezoneCommandArgs,
  SetTimezoneCommandResult,
} from '../reminders.types';

export class SetTimezoneCommand extends Command<SetTimezoneCommandResult> {
  constructor(private readonly args: SetTimezoneCommandArgs) {
    super();
  }

  get userId(): string {
    return this.args.userId;
  }

  get chatId(): string {
    return this.args.chatId;
  }

  get timezone(): string {
    return this.args.timezone;
  }
}
