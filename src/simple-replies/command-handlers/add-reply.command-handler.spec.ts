import { Test, TestingModule } from '@nestjs/testing';
import { AddReplyCommand } from '../commands/add-reply.command';
import { SimpleRepliesRepository } from '../simple-replies.repository';
import { AddReplyCommandHandler } from './add-reply.command-handler';

describe('AddReplyCommandHandler', () => {
  let handler: AddReplyCommandHandler;
  let repository: jest.Mocked<SimpleRepliesRepository>;

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddReplyCommandHandler,
        {
          provide: SimpleRepliesRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    handler = module.get<AddReplyCommandHandler>(AddReplyCommandHandler);
    repository = module.get(SimpleRepliesRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should create a reply and return success message', async () => {
      const pattern = 'hello';
      const command = new AddReplyCommand({ pattern });
      repository.create.mockResolvedValue(true);

      const result = await handler.execute(command);

      expect(repository.create).toHaveBeenCalledWith(pattern, 'response here');
      expect(result).toEqual({
        reply_text: `✅ Reply for ${pattern} added.`,
      });
    });
  });
});
