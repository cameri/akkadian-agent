import { Command } from '@nestjs/cqrs';
import {
  AddReplyCommandArgs,
  AddReplyCommandResult,
} from '../simple-replies.types';

export class AddReplyCommand extends Command<AddReplyCommandResult> {
  constructor(private readonly args: AddReplyCommandArgs) {
    super();
  }

  get pattern() {
    return this.args.pattern;
  }
}
