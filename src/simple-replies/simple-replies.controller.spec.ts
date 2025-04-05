import { Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { Update } from '../transports/telegram/ext/update';
import { Message } from '../transports/telegram/telegram.types';
import { AddReplyCommand } from './commands/add-reply.command';
import { RemoveReplyCommand } from './commands/remove-reply.command';
import { GetReplyQuery } from './queries/get-reply.query';
import { SimpleRepliesController } from './simple-replies.controller';

describe('SimpleRepliesController', () => {
  let controller: SimpleRepliesController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;
  let logger: jest.Mocked<Logger>;

  beforeEach(async () => {
    const mockCommandBus = {
      execute: jest.fn(),
    };

    const mockQueryBus = {
      execute: jest.fn(),
    };

    const mockLogger = {
      log: jest.fn(),
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
    it('should construct and execute AddReplyCommand', async () => {
      const pattern = 'hello';
      const message = {
        text: `/addreply ${pattern}`,
      } as Message;

      const update = new Update({
        update_id: 1,
        message,
      });

      const expectedResponse = { reply_text: 'Success' };
      commandBus.execute.mockResolvedValue(expectedResponse);

      const result = await controller.handleAddReplyMessage(update);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(AddReplyCommand),
      );
      expect(result).toBe(expectedResponse);
    });
  });

  describe('handleRemoveReplyMessage', () => {
    it('should construct and execute RemoveReplyCommand', async () => {
      const pattern = 'hello';
      const message = {
        text: `/remove_reply ${pattern}`,
      } as Message;

      const update = new Update({
        update_id: 1,
        message,
      });

      const expectedResponse = { reply_text: 'Success' };
      commandBus.execute.mockResolvedValue(expectedResponse);

      const result = await controller.handleRemoveReplyMessage(update);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(RemoveReplyCommand),
      );
      expect(result).toBe(expectedResponse);
    });
  });

  describe('handleTextMessage', () => {
    it('should execute GetReplyQuery', async () => {
      const message = {
        text: 'some text',
      } as Message;

      const update = new Update({
        update_id: 1,
        message,
      });

      const expectedResponse = null;
      queryBus.execute.mockResolvedValue(expectedResponse);

      await controller.handleTextMessage(update);

      expect(queryBus.execute).toHaveBeenCalledWith(expect.any(GetReplyQuery));
    });
  });
});
