import { DeepMocked } from '@golevelup/ts-jest';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { DeleteResult, Model } from 'mongoose';
import { Reply, ReplyDocument } from './schemas/reply.schema';
import { ReplyRepository } from './simple-replies.repository';
import { PatternType, ResponseType } from './simple-reply.constants';

describe('SimpleRepliesRepository', () => {
  let repository: ReplyRepository;
  let simplyReplyModelMock: DeepMocked<Model<Reply>>;
  beforeEach(async () => {
    simplyReplyModelMock = {
      create: jest.fn(),
      deleteOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      findOne: jest.fn(),
    } as unknown as DeepMocked<Model<Reply>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReplyRepository,
        {
          provide: getModelToken(Reply.name),
          useValue: simplyReplyModelMock,
        },
      ],
    }).compile();

    repository = module.get<ReplyRepository>(ReplyRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should upsert a new simple reply and return if successful', async () => {
      const pattern = 'hello';
      const response = 'world';
      const patternType = PatternType.Exact;
      const responseType = ResponseType.Text;
      const mockResult: ReplyDocument = {} as unknown as ReplyDocument;
      simplyReplyModelMock.findOneAndUpdate.mockResolvedValue(mockResult);

      const result = await repository.create({
        pattern,
        patternType,
        response,
        responseType,
      });

      expect(simplyReplyModelMock.findOneAndUpdate).toHaveBeenCalledWith(
        {
          pattern,
        },
        { response, patternType, responseType },
        { upsert: true, new: true },
      );
      expect(result).toBeDefined();
    });
  });

  describe('delete', () => {
    it('should delete a simple reply and return true if successful', async () => {
      const pattern = 'hello';
      const mockResult = { deletedCount: 1 } as unknown as DeleteResult;
      simplyReplyModelMock.deleteOne.mockResolvedValue(mockResult);

      const result = await repository.delete(pattern);

      expect(simplyReplyModelMock.deleteOne).toHaveBeenCalledWith({ pattern });
      expect(result).toBe(true);
    });
  });

  describe('findOneByPattern', () => {
    it('should find a simple reply by pattern', async () => {
      const pattern = 'hello';
      const mockReply = { pattern, response: 'world' };
      simplyReplyModelMock.findOne.mockResolvedValue(mockReply);

      const result = await repository.findOneByPattern(pattern);

      expect(simplyReplyModelMock.findOne).toHaveBeenCalledWith({ pattern });
      expect(result).toEqual(mockReply);
    });
  });
});
