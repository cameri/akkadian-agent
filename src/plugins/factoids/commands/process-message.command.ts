import { Command } from '@nestjs/cqrs';
import type {
  ProcessMessageCommandArgs,
  ProcessMessageCommandResult,
} from '../factoids.types';

export class ProcessMessageCommand extends Command<ProcessMessageCommandResult> {
  constructor(private readonly args: ProcessMessageCommandArgs) {
    super();
  }

  get chatId(): string {
    return this.args.chatId;
  }

  get text(): string {
    return this.args.text;
  }

  get userId(): string | undefined {
    return this.args.userId;
  }

  get username(): string | undefined {
    return this.args.username;
  }
}
