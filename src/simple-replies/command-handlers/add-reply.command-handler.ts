import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AddReplyCommand } from '../commands/add-reply.command';
import { SimpleRepliesRepository } from '../simple-replies.repository';
import {
  AddReplyCommandArgs,
  AddReplyCommandResult,
} from '../simple-replies.types';

@CommandHandler(AddReplyCommand)
export class AddReplyCommandHandler
  implements ICommandHandler<AddReplyCommandArgs, AddReplyCommandResult>
{
  constructor(private readonly repository: SimpleRepliesRepository) {}

  async execute(command: AddReplyCommand): Promise<AddReplyCommandResult> {
    await this.repository.create(command.pattern, 'response here');
    return Promise.resolve({
      reply_text: `✅ Reply for ${command.pattern} added.`,
    });
  }
}
