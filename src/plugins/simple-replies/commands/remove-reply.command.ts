import { Command } from '@nestjs/cqrs';
import {
  RemoveReplyCommandArgs,
  RemoveReplyCommandResult,
} from '../simple-replies.types';

export class RemoveReplyCommand extends Command<RemoveReplyCommandResult> {
  constructor(private readonly args: RemoveReplyCommandArgs) {
    super();
  }

  get pattern() {
    return this.args.pattern;
  }
}
