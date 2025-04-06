import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AddReplyCommand } from '../commands/add-reply.command';
import { ReplyRepository } from '../simple-replies.repository';
import { AddReplyCommandResult } from '../simple-replies.types';

@CommandHandler(AddReplyCommand)
export class AddReplyCommandHandler
  implements ICommandHandler<AddReplyCommand, AddReplyCommandResult>
{
  constructor(private readonly repository: ReplyRepository) {}

  async execute(command: AddReplyCommand): Promise<AddReplyCommandResult> {
    try {
      await this.repository.create(command.reply);

      return {
        result: true,
      };
    } catch (error) {
      return {
        error: `Unable to add reply: ${error}`,
      };
    }
  }
}
