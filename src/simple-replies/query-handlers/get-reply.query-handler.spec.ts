import { Test, TestingModule } from '@nestjs/testing';
import { GetReplyQuery } from '../queries/get-reply.query';
import { ReplyRepository } from '../simple-replies.repository';
import { IReply } from '../simple-replies.types';
import { PatternType, ResponseType } from '../simple-reply.constants';
import { GetReplyQueryHandler } from './get-reply.query-handler';

describe('GetReplyQueryHandler', () => {
  let handler: GetReplyQueryHandler;
  let repository: jest.Mocked<ReplyRepository>;

  beforeEach(async () => {
    const mockRepository = {
      findOneByPattern: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetReplyQueryHandler,
        {
          provide: ReplyRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    handler = module.get<GetReplyQueryHandler>(GetReplyQueryHandler);
    repository = module.get(ReplyRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return a reply when found', async () => {
      const pattern = 'hello';
      const query = new GetReplyQuery({ pattern });
      const mockReply: IReply = {
        pattern,
        patternType: PatternType.Exact,
        response: 'Hi there!',
        responseType: ResponseType.Text,
      };
      repository.findOneByPattern.mockResolvedValue(mockReply);

      const result = await handler.execute(query);

      expect(repository.findOneByPattern).toHaveBeenCalledWith(pattern);
      expect(result.result).toEqual(mockReply);
    });

    it('should return null when reply not found', async () => {
      const pattern = 'nonexistent';
      const query = new GetReplyQuery({ pattern });
      repository.findOneByPattern.mockResolvedValue(undefined);

      const result = await handler.execute(query);

      expect(repository.findOneByPattern).toHaveBeenCalledWith(pattern);
      expect(result.error).toBeUndefined();
      expect(result.result).toBeUndefined();
    });
  });
});
