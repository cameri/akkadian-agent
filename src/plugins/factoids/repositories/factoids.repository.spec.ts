import { createMock } from '@golevelup/ts-jest';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import type { IFactoid } from '../factoids.types';
import { Factoid } from '../schemas/factoid.schema';
import { FactoidsRepository } from './factoids.repository';

describe('FactoidsRepository', () => {
  let repository: FactoidsRepository;
  let factoidModel: jest.Mocked<Model<Factoid>>;

  const mockFactoid: IFactoid = {
    id: '507f1f77bcf86cd799439011',
    chatId: 'test-chat-123',
    subject: 'TypeScript',
    predicate: 'is a programming language',
    confidence: 0.9,
    userId: 'user123',
    username: 'testuser',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FactoidsRepository,
        {
          provide: getModelToken(Factoid.name),
          useValue: createMock<Model<Factoid>>(),
        },
      ],
    }).compile();

    repository = module.get<FactoidsRepository>(FactoidsRepository);
    factoidModel = module.get(getModelToken(Factoid.name));
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a new factoid', async () => {
      // Arrange
      const createData = {
        chatId: 'test-chat-123',
        subject: 'TypeScript',
        predicate: 'is a programming language',
        confidence: 0.9,
        userId: 'user123',
        username: 'testuser',
      };

      const mockDoc = {
        ...mockFactoid,
        toObject: jest.fn().mockReturnValue(mockFactoid),
      };

      factoidModel.create.mockResolvedValue(mockDoc as any);

      // Act
      const result = await repository.create(createData);

      // Assert
      expect(result).toEqual(mockFactoid);
      expect(factoidModel.create).toHaveBeenCalledWith({
        ...createData,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should handle creation errors', async () => {
      // Arrange
      const createData = {
        chatId: 'test-chat-123',
        subject: 'TypeScript',
        predicate: 'is a programming language',
        confidence: 0.9,
        userId: 'user123',
        username: 'testuser',
      };

      factoidModel.create.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(repository.create(createData)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('findBySubject', () => {
    it('should find factoid by subject', async () => {
      // Arrange
      const chatId = 'test-chat-123';
      const subject = 'TypeScript';

      const mockDoc = {
        toObject: jest.fn().mockReturnValue(mockFactoid),
      };

      factoidModel.findOne.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockDoc),
      } as any);

      // Act
      const result = await repository.findBySubject(chatId, subject);

      // Assert
      expect(result).toEqual(mockFactoid);
      expect(factoidModel.findOne).toHaveBeenCalledWith({
        chatId,
        subject,
        deletedAt: { $exists: false },
      });
    });

    it('should return null when factoid not found', async () => {
      // Arrange
      const chatId = 'test-chat-123';
      const subject = 'Unknown';

      factoidModel.findOne.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      // Act
      const result = await repository.findBySubject(chatId, subject);

      // Assert
      expect(result).toBeNull();
    });

    it('should sort by updatedAt descending for latest version', async () => {
      // Arrange
      const chatId = 'test-chat-123';
      const subject = 'TypeScript';

      const sortMock = jest.fn().mockReturnThis();
      factoidModel.findOne.mockReturnValue({
        sort: sortMock,
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      // Act
      await repository.findBySubject(chatId, subject);

      // Assert
      expect(sortMock).toHaveBeenCalledWith({ updatedAt: -1 });
    });
  });

  describe('findByChatId', () => {
    it('should find all factoids for a chat', async () => {
      // Arrange
      const chatId = 'test-chat-123';
      const mockFactoids = [mockFactoid];

      const mockDocs = mockFactoids.map((factoid) => ({
        toObject: jest.fn().mockReturnValue(factoid),
      }));

      factoidModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockDocs),
      } as any);

      // Act
      const result = await repository.findByChatId(chatId);

      // Assert
      expect(result).toEqual(mockFactoids);
      expect(factoidModel.find).toHaveBeenCalledWith({
        chatId,
        deletedAt: { $exists: false },
      });
    });

    it('should apply limit when provided', async () => {
      // Arrange
      const chatId = 'test-chat-123';
      const limit = 10;

      const limitMock = jest.fn().mockReturnThis();
      factoidModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: limitMock,
        exec: jest.fn().mockResolvedValue([]),
      } as any);

      // Act
      await repository.findByChatId(chatId, limit);

      // Assert
      expect(limitMock).toHaveBeenCalledWith(limit);
    });

    it('should sort by confidence descending', async () => {
      // Arrange
      const chatId = 'test-chat-123';

      const sortMock = jest.fn().mockReturnThis();
      factoidModel.find.mockReturnValue({
        sort: sortMock,
        exec: jest.fn().mockResolvedValue([]),
      } as any);

      // Act
      await repository.findByChatId(chatId);

      // Assert
      expect(sortMock).toHaveBeenCalledWith({ confidence: -1 });
    });
  });

  describe('searchByText', () => {
    it('should search factoids by text query', async () => {
      // Arrange
      const chatId = 'test-chat-123';
      const searchText = 'programming';
      const limit = 10;
      const offset = 0;

      const mockFactoids = [mockFactoid];
      const mockDocs = mockFactoids.map((factoid) => ({
        toObject: jest.fn().mockReturnValue(factoid),
      }));

      factoidModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockDocs),
      } as any);

      // Act
      const result = await repository.searchByText(
        chatId,
        searchText,
        limit,
        offset,
      );

      // Assert
      expect(result).toEqual(mockFactoids);
      expect(factoidModel.find).toHaveBeenCalledWith({
        chatId,
        $or: [
          { subject: { $regex: searchText, $options: 'i' } },
          { predicate: { $regex: searchText, $options: 'i' } },
        ],
        deletedAt: { $exists: false },
      });
    });

    it('should apply pagination parameters correctly', async () => {
      // Arrange
      const chatId = 'test-chat-123';
      const searchText = 'test';
      const limit = 5;
      const offset = 10;

      const limitMock = jest.fn().mockReturnThis();
      const skipMock = jest.fn().mockReturnThis();

      factoidModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: limitMock,
        skip: skipMock,
        exec: jest.fn().mockResolvedValue([]),
      } as any);

      // Act
      await repository.searchByText(chatId, searchText, limit);

      // Assert
      expect(limitMock).toHaveBeenCalledWith(limit);
      expect(skipMock).toHaveBeenCalledWith(offset);
    });
  });

  describe('update', () => {
    it('should update an existing factoid', async () => {
      // Arrange
      const id = '507f1f77bcf86cd799439011';
      const updateData = {
        predicate: 'is a strongly typed programming language',
        confidence: 0.95,
      };

      const updatedFactoid = { ...mockFactoid, ...updateData };
      const mockDoc = {
        toObject: jest.fn().mockReturnValue(updatedFactoid),
      };

      factoidModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDoc),
      } as any);

      // Act
      const result = await repository.update(id, updateData);

      // Assert
      expect(result).toEqual(updatedFactoid);
      expect(factoidModel.findByIdAndUpdate).toHaveBeenCalledWith(
        id,
        {
          ...updateData,
          updatedAt: expect.any(Date),
        },
        { new: true },
      );
    });

    it('should return null when factoid not found for update', async () => {
      // Arrange
      const id = 'non-existent-id';
      const updateData = { predicate: 'updated predicate' };

      factoidModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      // Act
      const result = await repository.update(id, updateData);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should soft delete a factoid', async () => {
      // Arrange
      const id = '507f1f77bcf86cd799439011';

      factoidModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({}),
      } as any);

      // Act
      const result = await repository.delete(id);

      // Assert
      expect(result).toBe(true);
      expect(factoidModel.findByIdAndUpdate).toHaveBeenCalledWith(id, {
        deletedAt: expect.any(Date),
      });
    });

    it('should return false when factoid not found for deletion', async () => {
      // Arrange
      const id = 'non-existent-id';

      factoidModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      // Act
      const result = await repository.delete(id);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle database connection errors', async () => {
      // Arrange
      factoidModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('Connection lost')),
      } as any);

      // Act & Assert
      await expect(repository.findByChatId('test-chat')).rejects.toThrow(
        'Connection lost',
      );
    });

    it('should handle invalid ObjectId errors gracefully', async () => {
      // Arrange
      const invalidId = 'invalid-id';

      factoidModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('Cast to ObjectId failed')),
      } as any);

      // Act & Assert
      await expect(repository.update(invalidId, {})).rejects.toThrow(
        'Cast to ObjectId failed',
      );
    });
  });

  describe('performance considerations', () => {
    it('should handle large result sets efficiently', async () => {
      // Arrange
      const chatId = 'test-chat-123';
      const largeResultSet = Array(1000)
        .fill(null)
        .map((_, i) => ({
          toObject: jest
            .fn()
            .mockReturnValue({ ...mockFactoid, id: `fact-${i}` }),
        }));

      factoidModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(largeResultSet),
      } as any);

      // Act
      const startTime = Date.now();
      const result = await repository.findByChatId(chatId);
      const executionTime = Date.now() - startTime;

      // Assert
      expect(result).toHaveLength(1000);
      expect(executionTime).toBeLessThan(100); // Should be very fast due to mocking
    });

    it('should use appropriate indexes for text search', async () => {
      // Arrange
      const chatId = 'test-chat-123';
      const searchText = 'programming';

      factoidModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      } as any);

      // Act
      await repository.searchByText(chatId, searchText, 10);

      // Assert
      expect(factoidModel.find).toHaveBeenCalledWith({
        chatId,
        $or: [
          { subject: { $regex: searchText, $options: 'i' } },
          { predicate: { $regex: searchText, $options: 'i' } },
        ],
        deletedAt: { $exists: false },
      });
    });
  });
});
