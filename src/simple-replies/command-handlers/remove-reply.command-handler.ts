import { Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RemoveReplyCommand } from '../commands/remove-reply.command';
import { SimpleRepliesRepository } from '../simple-replies.repository';
import {
  RemoveReplyCommandArgs,
  RemoveReplyCommandResult,
} from '../simple-replies.types';

@CommandHandler(RemoveReplyCommand)
export class RemoveReplyCommandHandler
  implements ICommandHandler<RemoveReplyCommandArgs, RemoveReplyCommandResult>
{
  constructor(
    private readonly repository: SimpleRepliesRepository,
    private readonly logger: Logger,
  ) {}

  async execute(
    command: RemoveReplyCommand,
  ): Promise<RemoveReplyCommandResult> {
    const result = await this.repository.delete(command.pattern);
    this.logger.log(
      `Removed reply for pattern: ${command.pattern}: %o`,
      result,
    );
    return Promise.resolve({
      reply_text: `🗑️ Reply for ${command.pattern} removed.`,
    });
  }
}
