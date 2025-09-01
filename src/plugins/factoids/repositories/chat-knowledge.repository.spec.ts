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
});
