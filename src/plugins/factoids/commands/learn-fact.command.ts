import { Command } from '@nestjs/cqrs';
import type {
  LearnFactCommandArgs,
  LearnFactCommandResult,
} from '../factoids.types';

export class LearnFactCommand extends Command<LearnFactCommandResult> {
  constructor(private readonly args: LearnFactCommandArgs) {
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
