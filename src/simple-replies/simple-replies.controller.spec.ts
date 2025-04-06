import { Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { ReactionResponse } from '../transports/telegram/ext/reaction-response';
import { TelegramUpdate } from '../transports/telegram/ext/telegram-update';
import { TextResponse } from '../transports/telegram/ext/text-response';
import { IMessage } from '../transports/telegram/telegram.types';
import { AddReplyCommand } from './commands/add-reply.command';
import { RemoveReplyCommand } from './commands/remove-reply.command';
import { GetReplyQuery } from './queries/get-reply.query';
import { SimpleRepliesController } from './simple-replies.controller';
import { GetReplyQueryResult } from './simple-replies.types';
import { PatternType, ResponseType } from './simple-reply.constants';

describe('SimpleRepliesController', () => {
  let controller: SimpleRepliesController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(async () => {
    const mockCommandBus = {
      execute: jest.fn(),
    };

    const mockQueryBus = {
      execute: jest.fn(),
    };

    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      verbose: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SimpleRepliesController,
        {
          provide: CommandBus,
          useValue: mockCommandBus,
        },
        {
          provide: QueryBus,
          useValue: mockQueryBus,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    controller = module.get<SimpleRepliesController>(SimpleRepliesController);
    commandBus = module.get(CommandBus);
    queryBus = module.get(QueryBus);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('handleAddReplyMessage', () => {
    it('should return ReactionResponse on success', async () => {
      const pattern = 'hello';
      const message = {
        message_id: 1,
        chat: {
          id: 1,
        },
        text: `/add_reply ${pattern}`,
        reply_to_message: {
          text: 'world',
        },
      } as IMessage;

      const update = new TelegramUpdate({
        update_id: 1,
        message,
      });

      const expectedCommandResult = { result: true };
      commandBus.execute.mockResolvedValue(expectedCommandResult);

      const result = await controller.handleAddReplyMessage(message, update);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(AddReplyCommand),
      );
      expect(result).toBeInstanceOf(ReactionResponse);
    });

    it('should return TextResponse on error', async () => {
      const pattern = 'hello';
      const message = {
        message_id: 1,
        chat: {
          id: 1,
        },
        text: `/add_reply ${pattern}`,
        reply_to_message: {
          text: 'world',
        },
      } as IMessage;

      const update = new TelegramUpdate({
        update_id: 1,
        message,
      });

      const expectedCommandResult = { error: 'Something went wrong' };
      commandBus.execute.mockResolvedValue(expectedCommandResult);

      const result = await controller.handleAddReplyMessage(message, update);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(AddReplyCommand),
      );
      expect(result).toBeInstanceOf(TextResponse);
    });
  });

  describe('handleRemoveReplyMessage', () => {
    it('should construct and execute RemoveReplyCommand', async () => {
      const pattern = 'hello';
      // Create a message with the specific text format
      const message = {
        text: `/remove_reply ${pattern}`,
      } as IMessage;

      // Create a TelegramUpdate with the message
      const update = new TelegramUpdate({
        update_id: 1,
        message,
      });

      // Mock the properties needed by the removeReplyCommandRegExp match
      Object.defineProperty(update, 'text', {
        get: function () {
          return `/remove_reply ${pattern}`;
        },
      });

      const expectedResponse = {
        replyText: `🗑️ Reply for ${pattern} removed.`,
      };
      commandBus.execute.mockResolvedValue(expectedResponse);

      const result = await controller.handleRemoveReplyMessage(update);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(RemoveReplyCommand),
      );
      expect(result).toBe(expectedResponse);
    });
  });

  describe('handleTextMessage', () => {
    it('should execute GetReplyQuery and return TextResponse for text response type', async () => {
      const message = {
        message_id: 1,
        chat: {
          id: 1,
        },
        text: 'some text',
      } as IMessage;

      const update = new TelegramUpdate({
        update_id: 1,
        message,
      });

      const expectedResponse: GetReplyQueryResult = {
        result: {
          pattern: 'some text',
          patternType: PatternType.Exact,
          response: 'some response',
          responseType: ResponseType.Text,
        },
      };
      queryBus.execute.mockResolvedValue(expectedResponse);

      const result = await controller.handleTextMessage(message, update);

      expect(queryBus.execute).toHaveBeenCalledWith(expect.any(GetReplyQuery));
      expect(result).toBeInstanceOf(TextResponse);
    });

    it('should return undefined when no reply is found', async () => {
      const message = {
        message_id: 1,
        chat: {
          id: 1,
        },
        text: 'some text',
      } as IMessage;

      const update = new TelegramUpdate({
        update_id: 1,
        message,
      });

      queryBus.execute.mockResolvedValue({ result: undefined });

      const result = await controller.handleTextMessage(message, update);

      expect(queryBus.execute).toHaveBeenCalledWith(expect.any(GetReplyQuery));
      expect(result).toBeUndefined();
    });
  });
});
