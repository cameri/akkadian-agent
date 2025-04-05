import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { SimpleRepliesRepository } from './simple-replies.repository';

const mockSimpleReplyModel = {
  create: jest.fn().mockResolvedValue({}),
  deleteOne: jest.fn().mockResolvedValue({}),
  findOne: jest.fn().mockResolvedValue(null),
};

describe('SimpleRepliesRepository', () => {
  let repository: SimpleRepliesRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SimpleRepliesRepository,
        {
          provide: getModelToken('SimpleReply'),
          useValue: mockSimpleReplyModel,
        },
      ],
    }).compile();

    repository = module.get<SimpleRepliesRepository>(SimpleRepliesRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new simple reply and return true if successful', async () => {
      const pattern = 'hello';
      const response = 'world';
      const mockResult = { isNew: true };
      mockSimpleReplyModel.create.mockResolvedValue(mockResult);

      const result = await repository.create(pattern, response);

      expect(mockSimpleReplyModel.create).toHaveBeenCalledWith({
        pattern,
        response,
      });
      expect(result).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete a simple reply and return true if successful', async () => {
      const pattern = 'hello';
      const mockResult = { deletedCount: 1 };
      mockSimpleReplyModel.deleteOne.mockResolvedValue(mockResult);

      const result = await repository.delete(pattern);

      expect(mockSimpleReplyModel.deleteOne).toHaveBeenCalledWith({ pattern });
      expect(result).toBe(true);
    });
  });

  describe('findOneByPattern', () => {
    it('should find a simple reply by pattern', async () => {
      const pattern = 'hello';
      const mockReply = { pattern, response: 'world' };
      mockSimpleReplyModel.findOne.mockResolvedValue(mockReply);

      const result = await repository.findOneByPattern(pattern);

      expect(mockSimpleReplyModel.findOne).toHaveBeenCalledWith({ pattern });
      expect(result).toEqual(mockReply);
    });
  });
});
