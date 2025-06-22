import { Command } from '@nestjs/cqrs';
import {
  AddReplyCommandArgs,
  AddReplyCommandResult,
  IReply,
} from '../simple-replies.types';

export class AddReplyCommand extends Command<AddReplyCommandResult> {
  constructor(private readonly args: AddReplyCommandArgs) {
    super();
  }

  get reply(): IReply {
    return this.args;
  }
}
