import { createMock } from '@golevelup/ts-jest';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LearnFactCommand } from '../commands/learn-fact.command';
import { LearnFactCommandHandler } from './learn-fact.command-handler';
import { FactoidsRepository } from '../repositories/factoids.repository';
import { ChatKnowledgeRepository } from '../repositories/chat-knowledge.repository';
import { NaturalLanguageService } from '../services/natural-language.service';
import { CacheService } from '../services/cache.service';
import type { IFactoid } from '../factoids.types';
import { RESPONSE_TEMPLATES } from '../factoids.constants';

describe('LearnFactCommandHandler', () => {
  let handler: LearnFactCommandHandler;
  let factoidsRepository: jest.Mocked<FactoidsRepository>;
  let chatKnowledgeRepository: jest.Mocked<ChatKnowledgeRepository>;
  let naturalLanguageService: jest.Mocked<NaturalLanguageService>;
  let cacheService: jest.Mocked<CacheService>;

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
        LearnFactCommandHandler,
        Logger,
        {
          provide: FactoidsRepository,
          useValue: createMock<FactoidsRepository>(),
        },
        {
          provide: ChatKnowledgeRepository,
          useValue: createMock<ChatKnowledgeRepository>(),
        },
        {
          provide: NaturalLanguageService,
          useValue: createMock<NaturalLanguageService>(),
        },
        {
          provide: CacheService,
          useValue: createMock<CacheService>(),
        },
      ],
    }).compile();

    handler = module.get<LearnFactCommandHandler>(LearnFactCommandHandler);
    factoidsRepository = module.get(FactoidsRepository);
    chatKnowledgeRepository = module.get(ChatKnowledgeRepository);
    naturalLanguageService = module.get(NaturalLanguageService);
    cacheService = module.get(CacheService);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should learn a new fact successfully', async () => {
      // Arrange
      const command = new LearnFactCommand({
        chatId: 'test-chat-123',
        text: 'TypeScript is a programming language',
        userId: 'user123',
        username: 'testuser',
      });

      chatKnowledgeRepository.findByChatId.mockResolvedValue({
        chatId: 'test-chat-123',
        factCount: 5,
        settings: {
          learningEnabled: true,
          maxFacts: 10000,
          minConfidence: 0.6,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      naturalLanguageService.extractFact.mockResolvedValue({
        subject: 'TypeScript',
        predicate: 'is a programming language',
        confidence: 0.9,
      });

      factoidsRepository.findBySubject.mockResolvedValue(null);
      factoidsRepository.create.mockResolvedValue(mockFactoid);
      chatKnowledgeRepository.incrementFactCount.mockResolvedValue();
      cacheService.set.mockResolvedValue();

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.success).toBe(true);
      expect(result.factoid).toEqual(mockFactoid);
      expect(result.message).toContain('TypeScript');
      expect(result.message).toContain('is a programming language');
      expect(factoidsRepository.create).toHaveBeenCalledWith({
        chatId: 'test-chat-123',
        subject: 'TypeScript',
        predicate: 'is a programming language',
        confidence: 0.9,
        userId: 'user123',
        username: 'testuser',
      });
      expect(chatKnowledgeRepository.incrementFactCount).toHaveBeenCalledWith(
        'test-chat-123',
      );
    });

    it('should update an existing fact', async () => {
      // Arrange
      const command = new LearnFactCommand({
        chatId: 'test-chat-123',
        text: 'TypeScript is a strongly typed language',
        userId: 'user123',
        username: 'testuser',
      });

      chatKnowledgeRepository.findByChatId.mockResolvedValue({
        chatId: 'test-chat-123',
        factCount: 5,
        settings: {
          learningEnabled: true,
          maxFacts: 10000,
          minConfidence: 0.6,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      naturalLanguageService.extractFact.mockResolvedValue({
        subject: 'TypeScript',
        predicate: 'is a strongly typed language',
        confidence: 0.9,
      });

      factoidsRepository.findBySubject.mockResolvedValue(mockFactoid);
      factoidsRepository.create.mockResolvedValue({
        ...mockFactoid,
        predicate: 'is a strongly typed language',
      });

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('updated my knowledge');
      expect(chatKnowledgeRepository.incrementFactCount).not.toHaveBeenCalled();
    });

    it('should fail when fact extraction fails', async () => {
      // Arrange
      const command = new LearnFactCommand({
        chatId: 'test-chat-123',
        text: 'not a proper fact statement',
        userId: 'user123',
        username: 'testuser',
      });

      chatKnowledgeRepository.findByChatId.mockResolvedValue({
        chatId: 'test-chat-123',
        factCount: 5,
        settings: {
          learningEnabled: true,
          maxFacts: 10000,
          minConfidence: 0.6,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      naturalLanguageService.extractFact.mockResolvedValue(null);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe(RESPONSE_TEMPLATES.PARSING_ERROR);
    });

    it('should fail when learning is disabled', async () => {
      // Arrange
      const command = new LearnFactCommand({
        chatId: 'test-chat-123',
        text: 'TypeScript is a programming language',
        userId: 'user123',
        username: 'testuser',
      });

      chatKnowledgeRepository.findByChatId.mockResolvedValue({
        chatId: 'test-chat-123',
        factCount: 5,
        settings: {
          learningEnabled: false,
          maxFacts: 10000,
          minConfidence: 0.6,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('disabled');
    });
  });
});
