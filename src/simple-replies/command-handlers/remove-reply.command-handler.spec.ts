import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RemoveReplyCommand } from '../commands/remove-reply.command';
import { SimpleRepliesRepository } from '../simple-replies.repository';
import { RemoveReplyCommandHandler } from './remove-reply.command-handler';

describe('RemoveReplyCommandHandler', () => {
  let handler: RemoveReplyCommandHandler;
  let repository: jest.Mocked<SimpleRepliesRepository>;
  let logger: jest.Mocked<Logger>;

  beforeEach(async () => {
    const mockRepository = {
      delete: jest.fn(),
    };

    const mockLogger = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RemoveReplyCommandHandler,
        {
          provide: SimpleRepliesRepository,
          useValue: mockRepository,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    handler = module.get<RemoveReplyCommandHandler>(RemoveReplyCommandHandler);
    repository = module.get(SimpleRepliesRepository);
    logger = module.get(Logger);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should remove a reply and return success message', async () => {
      const pattern = 'hello';
      const command = new RemoveReplyCommand({ pattern });
      repository.delete.mockResolvedValue(true);

      const result = await handler.execute(command);

      expect(repository.delete).toHaveBeenCalledWith(pattern);
      expect(logger.log).toHaveBeenCalledWith(
        `Removed reply for pattern: ${pattern}: %o`,
        true,
      );
      expect(result).toEqual({
        reply_text: `🗑️ Reply for ${pattern} removed.`,
      });
    });

    it('should handle unsuccessful removal attempt', async () => {
      const pattern = 'hello';
      const command = new RemoveReplyCommand({ pattern });
      repository.delete.mockResolvedValue(false);

      const result = await handler.execute(command);

      expect(repository.delete).toHaveBeenCalledWith(pattern);
      expect(logger.log).toHaveBeenCalledWith(
        `Removed reply for pattern: ${pattern}: %o`,
        false,
      );
      expect(result).toEqual({
        reply_text: `🗑️ Reply for ${pattern} removed.`,
      });
    });
  });
});
