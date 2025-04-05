import { Test, TestingModule } from '@nestjs/testing';
import { PatternType, ResponseType } from '../models/simple-reply.constants';
import { SimpleReply } from '../models/simple-reply.model';
import { GetReplyQuery } from '../queries/get-reply.query';
import { SimpleRepliesRepository } from '../simple-replies.repository';
import { GetReplyQueryHandler } from './get-reply.query-handler';

describe('GetReplyQueryHandler', () => {
  let handler: GetReplyQueryHandler;
  let repository: jest.Mocked<SimpleRepliesRepository>;

  beforeEach(async () => {
    const mockRepository = {
      findOneByPattern: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetReplyQueryHandler,
        {
          provide: SimpleRepliesRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    handler = module.get<GetReplyQueryHandler>(GetReplyQueryHandler);
    repository = module.get(SimpleRepliesRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return a reply when found', async () => {
      const pattern = 'hello';
      const query = new GetReplyQuery(pattern);
      const mockReply: Partial<SimpleReply> = {
        pattern,
        patternType: PatternType.Exact,
        response: 'Hi there!',
        responseType: ResponseType.Text,
      };
      repository.findOneByPattern.mockResolvedValue(mockReply as SimpleReply);

      const result = await handler.execute(query);

      expect(repository.findOneByPattern).toHaveBeenCalledWith(pattern);
      expect(result).toEqual(mockReply);
    });

    it('should return null when reply not found', async () => {
      const pattern = 'nonexistent';
      const query = new GetReplyQuery(pattern);
      repository.findOneByPattern.mockResolvedValue(null);

      const result = await handler.execute(query);

      expect(repository.findOneByPattern).toHaveBeenCalledWith(pattern);
      expect(result).toBeNull();
    });
  });
});
