import { Controller, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Ctx, MessagePattern, Payload } from '@nestjs/microservices';
import { allPass, applySpec, path, pipe, test } from 'ramda';
import { TelegramUpdate } from '../../transports/telegram/ext/telegram-update';
import { TextResponse } from '../../transports/telegram/ext/text-response';
import { ReactionResponse } from '../../transports/telegram/ext/reaction-response';
import { TelegramServerTransport } from '../../transports/telegram/telegram.constants';
import type { IMessage } from '../../transports/telegram/telegram.types';
import { LearnFactCommand } from './commands/learn-fact.command';
import { ProcessMessageCommand } from './commands/process-message.command';
import {
  learnFactCommandRegExp,
  simpleQuestionRegExp,
  factStatementRegExp,
} from './factoids.constants';
import type {
  LearnFactCommandArgs,
  ProcessMessageCommandArgs,
} from './factoids.types';

// Message patterns for routing
const LearnFactCommandPattern = pipe(
  path(['effective_message', 'text']),
  test(learnFactCommandRegExp),
);

const QuestionPattern = pipe(
  path(['effective_message', 'text']),
  test(simpleQuestionRegExp),
);

const FactStatementPattern = pipe(
  path(['effective_message', 'text']),
  test(factStatementRegExp),
);

const GeneralMessagePattern = allPass([
  pipe(path(['effective_message', 'text']), Boolean),
  pipe(path(['effective_message', 'text']), test(/^[^/].+/)), // Not a command
]);

@Controller()
export class FactoidsController {
  private readonly logger = new Logger(FactoidsController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @MessagePattern(LearnFactCommandPattern, TelegramServerTransport)
  async handleLearnFactCommand(
    @Payload() message: IMessage,
    @Ctx() _update: TelegramUpdate,
  ) {
    this.logger.log(
      `Handling learn fact command from ${message.from?.first_name}: ${message.text}`,
    );

    const extractFactFromCommand = (text: string): string => {
      const match = text.match(learnFactCommandRegExp);
      return match?.groups?.fact || text;
    };

    const args: LearnFactCommandArgs = applySpec<LearnFactCommandArgs>({
      chatId: path(['chat', 'id']),
      text: pipe(path(['text']), extractFactFromCommand),
      userId: path(['from', 'id']),
      username: path(['from', 'username']),
    })(message);

    const command = new LearnFactCommand(args);
    const result = await this.commandBus.execute(command);

    if (result.error) {
      return new TextResponse({
        chat_id: message.chat.id,
        reply_parameters: {
          message_id: message.message_id,
        },
        text: `❌ ${result.error}`,
      });
    }

    if (result.success && result.message) {
      return new ReactionResponse({
        chat_id: message.chat.id,
        message_id: message.message_id,
        reaction: [
          {
            emoji: '🤔',
            type: 'emoji',
          },
        ],
      });
    }

    return new TextResponse({
      chat_id: message.chat.id,
      reply_parameters: {
        message_id: message.message_id,
      },
      text: result.message || '✅ Fact learned!',
    });
  }

  @MessagePattern(GeneralMessagePattern, TelegramServerTransport)
  async handleGeneralMessage(
    @Payload() message: IMessage,
    @Ctx() update: TelegramUpdate,
  ) {
    // Only process if the message looks like a question or fact statement
    if (!QuestionPattern(update) && !FactStatementPattern(update)) {
      return; // No response for other messages
    }

    this.logger.debug(
      `Processing general message from ${message.from?.first_name}: ${message.text}`,
    );

    const args: ProcessMessageCommandArgs =
      applySpec<ProcessMessageCommandArgs>({
        chatId: path(['chat', 'id']),
        text: path(['text']),
        userId: path(['from', 'id']),
        username: path(['from', 'username']),
      })(message);

    const command = new ProcessMessageCommand(args);
    const result = await this.commandBus.execute(command);

    if (result.error) {
      this.logger.error(`Error processing message: ${result.error}`);
      return; // Don't respond to errors to avoid spam
    }

    if (result.response) {
      return new TextResponse({
        chat_id: message.chat.id,
        reply_parameters: {
          message_id: message.message_id,
        },
        text: result.response,
      });
    }

    // No response needed
    return;
  }
}
