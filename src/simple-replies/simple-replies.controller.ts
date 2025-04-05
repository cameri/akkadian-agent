import { Controller, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { plainToInstance } from 'class-transformer';
import { applySpec, construct, match, path, pipe, test } from 'ramda';
import { Update } from '../transports/telegram/ext/update';
import { TelegramServerTransport } from '../transports/telegram/telegram.constants';
import { AddReplyCommand } from './commands/add-reply.command';
import { RemoveReplyCommand } from './commands/remove-reply.command';
import { GetReplyQuery } from './queries/get-reply.query';
import {
  addReplyCommandRegExp,
  removeReplyCommandRegExp,
} from './simple-replies.constants';
import {
  AddReplyCommandArgs,
  RemoveReplyCommandArgs,
} from './simple-replies.types';

const AddReplyCommandPattern = pipe(
  path(['effective_message', 'text']),
  test(addReplyCommandRegExp),
);

const RemoveReplyCommandPattern = pipe(
  path(['effective_message', 'text']),
  test(removeReplyCommandRegExp),
);

@Controller()
export class SimpleRepliesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly logger: Logger,
  ) {}

  @MessagePattern(AddReplyCommandPattern, TelegramServerTransport)
  handleAddReplyMessage(@Payload() update: Update) {
    this.logger.log('woot');
    const constructCommand = pipe<
      [Update],
      AddReplyCommandArgs,
      AddReplyCommand
    >(
      applySpec<AddReplyCommandArgs>({
        pattern: pipe(
          path(['effective_message', 'text']),
          match(addReplyCommandRegExp),
          path(['groups', 'pattern']),
        ),
      }),
      construct(AddReplyCommand),
    );

    const command = constructCommand(update);

    return this.commandBus.execute(command);
  }

  @MessagePattern(RemoveReplyCommandPattern, TelegramServerTransport)
  handleRemoveReplyMessage(@Payload() update: Update) {
    const constructCommand = pipe<
      [Update],
      RemoveReplyCommandArgs,
      RemoveReplyCommand
    >(
      applySpec<RemoveReplyCommandArgs>({
        pattern: pipe(
          path(['effective_message', 'text']),
          match(removeReplyCommandRegExp),
          path(['groups', 'pattern']),
        ),
      }),
      construct(RemoveReplyCommand),
    );

    const command = constructCommand(update);

    return this.commandBus.execute(command);
  }

  @MessagePattern(
    pipe(path(['effective_message', 'text']), test(/.*/)),
    TelegramServerTransport,
  )
  async handleTextMessage(@Payload() _update: Update): Promise<void> {
    const query = plainToInstance(GetReplyQuery, {});
    await this.queryBus.execute(query);
  }
}
