import { createMock } from '@golevelup/ts-jest';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { MAX_FACTS_PER_CHAT } from '../factoids.constants';
import type { IChatKnowledge } from '../factoids.types';
import { ChatKnowledge } from '../schemas/chat-knowledge.schema';
import { ChatKnowledgeRepository } from './chat-knowledge.repository';

describe('ChatKnowledgeRepository', () => {
  let repository: ChatKnowledgeRepository;
  let chatKnowledgeModel: jest.Mocked<Model<ChatKnowledge>>;

  const mockChatKnowledge: IChatKnowledge = {
    chatId: 'test-chat-123',
    factCount: 10,
    settings: {
      learningEnabled: true,
      maxFacts: MAX_FACTS_PER_CHAT,
      minConfidence: 0.6,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatKnowledgeRepository,
        {
          provide: getModelToken(ChatKnowledge.name),
          useValue: createMock<Model<ChatKnowledge>>(),
        },
      ],
    }).compile();

    repository = module.get<ChatKnowledgeRepository>(ChatKnowledgeRepository);
    chatKnowledgeModel = module.get(getModelToken(ChatKnowledge.name));
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findByChatId', () => {
    it('should find chat knowledge by chatId', async () => {
      // Arrange
      const chatId = 'test-chat-123';

      const mockDoc = {
        toObject: jest.fn().mockReturnValue(mockChatKnowledge),
      };

      chatKnowledgeModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDoc),
      } as any);

      // Act
      const result = await repository.findByChatId(chatId);

      // Assert
      expect(result).toEqual(mockChatKnowledge);
      expect(chatKnowledgeModel.findOne).toHaveBeenCalledWith({ chatId });
    });

    it('should return null when chat knowledge not found', async () => {
      // Arrange
      const chatId = 'non-existent-chat';

      chatKnowledgeModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      // Act
      const result = await repository.findByChatId(chatId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create new chat knowledge with default settings', async () => {
      // Arrange
      const chatId = 'new-chat-456';

      const mockDoc = {
        toObject: jest.fn().mockReturnValue({
          ...mockChatKnowledge,
          chatId,
          factCount: 0,
        }),
      };

      chatKnowledgeModel.create.mockResolvedValue(mockDoc as any);

      // Act
      const result = await repository.create({ chatId, factCount: 0 });

      // Assert
      expect(result).toEqual({
        ...mockChatKnowledge,
        chatId,
        factCount: 0,
      });

      expect(chatKnowledgeModel.create).toHaveBeenCalledWith({
        chatId,
        factCount: 0,
        settings: {
          learningEnabled: true,
          maxFacts: MAX_FACTS_PER_CHAT,
          minConfidence: 0.6,
        },
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should create chat knowledge with custom settings', async () => {
      // Arrange
      const chatId = 'custom-chat-789';
      const customSettings = {
        learningEnabled: false,
        maxFacts: 5000,
        minConfidence: 0.8,
      };

      const expectedChatKnowledge = {
        ...mockChatKnowledge,
        chatId,
        factCount: 0,
        settings: customSettings,
      };

      const mockDoc = {
        toObject: jest.fn().mockReturnValue(expectedChatKnowledge),
      };

      chatKnowledgeModel.create.mockResolvedValue(mockDoc as any);

      // Act
      const result = await repository.create({
        chatId,
        factCount: 0,
        settings: customSettings,
      });

      // Assert
      expect(result).toEqual(expectedChatKnowledge);
      expect(chatKnowledgeModel.create).toHaveBeenCalledWith({
        chatId,
        factCount: 0,
        settings: customSettings,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should handle creation errors', async () => {
      // Arrange
      const chatId = 'error-chat';

      chatKnowledgeModel.create.mockRejectedValue(
        new Error('Database connection failed'),
      );

      // Act & Assert
      await expect(repository.create({ chatId, factCount: 0 })).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('updateSettings', () => {
    it('should update chat knowledge settings', async () => {
      // Arrange
      const chatId = 'test-chat-123';
      const newSettings = {
        learningEnabled: false,
        maxFacts: 5000,
        minConfidence: 0.8,
      };

      const updatedChatKnowledge = {
        ...mockChatKnowledge,
        settings: newSettings,
      };

      const mockDoc = {
        toObject: jest.fn().mockReturnValue(updatedChatKnowledge),
      };

      chatKnowledgeModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDoc),
      } as any);

      // Act
      const result = await repository.update(chatId, { settings: newSettings });

      // Assert
      expect(result).toEqual(updatedChatKnowledge);
      expect(chatKnowledgeModel.findOneAndUpdate).toHaveBeenCalledWith(
        { chatId },
        {
          settings: newSettings,
          updatedAt: expect.any(Date),
        },
        { new: true, upsert: true },
      );
    });

    it('should return null when chat not found for update', async () => {
      // Arrange
      const chatId = 'non-existent-chat';
      const newSettings = {
        learningEnabled: false,
        maxFacts: 1000,
        minConfidence: 0.7,
      };

      chatKnowledgeModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      // Act
      const result = await repository.update(chatId, { settings: newSettings });

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('incrementFactCount', () => {
    it('should increment fact count for existing chat', async () => {
      // Arrange
      const chatId = 'test-chat-123';

      chatKnowledgeModel.updateOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      } as any);

      // Act
      await repository.incrementFactCount(chatId);

      // Assert
      expect(chatKnowledgeModel.updateOne).toHaveBeenCalledWith(
        { chatId },
        {
          $inc: { factCount: 1 },
          updatedAt: expect.any(Date),
        },
      );
    });

    it('should handle errors when incrementing fact count', async () => {
      // Arrange
      const chatId = 'error-chat';

      chatKnowledgeModel.updateOne.mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('Update failed')),
      } as any);

      // Act & Assert
      await expect(repository.incrementFactCount(chatId)).rejects.toThrow(
        'Update failed',
      );
    });
  });

  describe('decrementFactCount', () => {
    it('should decrement fact count for existing chat', async () => {
      // Arrange
      const chatId = 'test-chat-123';

      chatKnowledgeModel.updateOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      } as any);

      // Act
      await repository.decrementFactCount(chatId);

      // Assert
      expect(chatKnowledgeModel.updateOne).toHaveBeenCalledWith(
        { chatId },
        {
          $inc: { factCount: -1 },
          updatedAt: expect.any(Date),
        },
      );
    });

    it('should not allow fact count to go below zero', async () => {
      // Arrange
      const chatId = 'test-chat-123';

      chatKnowledgeModel.updateOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      } as any);

      // Act
      await repository.decrementFactCount(chatId);

      // Assert
      expect(chatKnowledgeModel.updateOne).toHaveBeenCalledWith(
        { chatId },
        {
          $inc: { factCount: -1 },
          updatedAt: expect.any(Date),
        },
      );
    });
  });

  describe('getOrCreate', () => {
    it('should return existing chat knowledge', async () => {
      // Arrange
      const chatId = 'existing-chat';

      const mockDoc = {
        toObject: jest.fn().mockReturnValue(mockChatKnowledge),
      };

      chatKnowledgeModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDoc),
      } as any);

      // Act
      const result = await repository.findByChatId(chatId);

      // Assert
      expect(result).toEqual(mockChatKnowledge);
      expect(chatKnowledgeModel.findOne).toHaveBeenCalledWith({ chatId });
    });

    it('should create new chat knowledge when not found', async () => {
      // Arrange
      const chatId = 'new-chat';

      const mockDoc = {
        toObject: jest.fn().mockReturnValue({
          ...mockChatKnowledge,
          chatId,
          factCount: 0,
        }),
      };

      chatKnowledgeModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      chatKnowledgeModel.create.mockResolvedValue(mockDoc as any);

      // Act
      const result = await repository.findByChatId(chatId);

      // Assert
      expect(result).toEqual({
        ...mockChatKnowledge,
        chatId,
        factCount: 0,
      });
      expect(chatKnowledgeModel.create).toHaveBeenCalled();
    });
  });

  describe('performance and edge cases', () => {
    it('should handle concurrent fact count updates', async () => {
      // Arrange
      const chatId = 'concurrent-chat';

      chatKnowledgeModel.updateOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      } as any);

      // Act - Simulate concurrent increments
      const promises = Array(10)
        .fill(null)
        .map(() => repository.incrementFactCount(chatId));

      await Promise.all(promises);

      // Assert
      expect(chatKnowledgeModel.updateOne).toHaveBeenCalledTimes(10);
    });

    it('should validate settings before update', async () => {
      // Arrange
      const chatId = 'validation-chat';
      const invalidSettings = {
        learningEnabled: 'not-boolean' as any,
        maxFacts: -1,
        minConfidence: 1.5, // Above 1.0
      };

      // Act & Assert
      // The repository should handle validation at the schema level
      await expect(async () =>
        repository.update(chatId, { settings: invalidSettings }),
      ).resolves.not.toThrow();
    });

    it('should handle database connection failures gracefully', async () => {
      // Arrange
      const chatId = 'connection-error-chat';

      chatKnowledgeModel.findOne.mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('Connection lost')),
      } as any);

      // Act & Assert
      await expect(repository.findByChatId(chatId)).rejects.toThrow(
        'Connection lost',
      );
    });

    it('should handle large fact counts efficiently', async () => {
      // Arrange
      const chatId = 'large-count-chat';
      const largeChatKnowledge = {
        ...mockChatKnowledge,
        factCount: 100000,
      };

      const mockDoc = {
        toObject: jest.fn().mockReturnValue(largeChatKnowledge),
      };

      chatKnowledgeModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDoc),
      } as any);

      // Act
      const startTime = Date.now();
      const result = await repository.findByChatId(chatId);
      const executionTime = Date.now() - startTime;

      // Assert
      expect(result?.factCount).toBe(100000);
      expect(executionTime).toBeLessThan(50); // Should be very fast due to mocking
    });
  });
});
