import { createMock } from '@golevelup/ts-jest';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { QUERY_TIMEOUT_MS } from '../factoids.constants';
import type { IFactoid } from '../factoids.types';
import { FindFactQuery } from '../queries/find-fact.query';
import { FactoidsRepository } from '../repositories/factoids.repository';
import { CacheService } from '../services/cache.service';
import { NaturalLanguageService } from '../services/natural-language.service';
import { FindFactQueryHandler } from './find-fact.query-handler';

describe('FindFactQueryHandler', () => {
  let handler: FindFactQueryHandler;
  let factoidsRepository: jest.Mocked<FactoidsRepository>;
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
        FindFactQueryHandler,
        Logger,
        {
          provide: FactoidsRepository,
          useValue: createMock<FactoidsRepository>(),
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

    handler = module.get<FindFactQueryHandler>(FindFactQueryHandler);
    factoidsRepository = module.get(FactoidsRepository);
    naturalLanguageService = module.get(NaturalLanguageService);
    cacheService = module.get(CacheService);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should find exact match fact', async () => {
      // Arrange
      const query = new FindFactQuery({
        chatId: 'test-chat-123',
        subject: 'TypeScript',
        minConfidence: 0.8,
      });

      factoidsRepository.findBySubject.mockResolvedValue(mockFactoid);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.factoid).toEqual(mockFactoid);
      expect(result.confidence).toBeGreaterThan(0);
      expect(factoidsRepository.findBySubject).toHaveBeenCalledWith(
        'test-chat-123',
        'TypeScript',
      );
    });

    it('should find similar fact when exact match not found', async () => {
      // Arrange
      const query = new FindFactQuery({
        chatId: 'test-chat-123',
        subject: 'typescript',
        minConfidence: 0.8,
      });

      const allFacts = [mockFactoid];

      factoidsRepository.findBySubject.mockResolvedValue(null);
      factoidsRepository.findByChatId.mockResolvedValue(allFacts);
      naturalLanguageService.calculateSimilarity.mockResolvedValue(0.95);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.factoid).toEqual(mockFactoid);
      expect(result.confidence).toBeGreaterThan(0);
      expect(naturalLanguageService.calculateSimilarity).toHaveBeenCalledWith(
        'typescript',
        'TypeScript',
        expect.any(String),
      );
    });

    it('should return null when no matching fact found', async () => {
      // Arrange
      const query = new FindFactQuery({
        chatId: 'test-chat-123',
        subject: 'Unknown Subject',
        minConfidence: 0.8,
      });

      factoidsRepository.findBySubject.mockResolvedValue(null);
      factoidsRepository.findByChatId.mockResolvedValue([]);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.factoid).toBeUndefined();
      expect(result.confidence).toBeUndefined();
    });

    it('should return cached result if available', async () => {
      // Arrange
      const query = new FindFactQuery({
        chatId: 'test-chat-123',
        subject: 'TypeScript',
        minConfidence: 0.8,
      });

      cacheService.get.mockResolvedValue(mockFactoid);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.factoid).toEqual(mockFactoid);
      expect(result.confidence).toBeGreaterThan(0);
      expect(factoidsRepository.findBySubject).not.toHaveBeenCalled();
    });

    it('should cache successful results', async () => {
      // Arrange
      const query = new FindFactQuery({
        chatId: 'test-chat-123',
        subject: 'TypeScript',
        minConfidence: 0.8,
      });

      cacheService.get.mockResolvedValue(null);
      factoidsRepository.findBySubject.mockResolvedValue(mockFactoid);

      // Act
      await handler.execute(query);

      // Assert
      expect(cacheService.set).toHaveBeenCalledWith(
        expect.stringContaining('fact:test-chat-123:TypeScript'),
        mockFactoid,
        expect.any(Number),
      );
    });

    it('should meet query performance requirements under 50ms', async () => {
      // Arrange
      const query = new FindFactQuery({
        chatId: 'test-chat-123',
        subject: 'TypeScript',
        minConfidence: 0.8,
      });

      factoidsRepository.findBySubject.mockResolvedValue(mockFactoid);

      // Act
      const startTime = Date.now();
      await handler.execute(query);
      const executionTime = Date.now() - startTime;

      // Assert
      expect(executionTime).toBeLessThan(QUERY_TIMEOUT_MS);
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const query = new FindFactQuery({
        chatId: 'test-chat-123',
        subject: 'TypeScript',
        minConfidence: 0.8,
      });

      cacheService.get.mockResolvedValue(null);
      factoidsRepository.findBySubject.mockRejectedValue(
        new Error('Database connection failed'),
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.factoid).toBeUndefined();
      expect(result.error).toContain('Database connection failed');
    });

    it('should filter facts by minimum similarity threshold', async () => {
      // Arrange
      const query = new FindFactQuery({
        chatId: 'test-chat-123',
        subject: 'JS',
        minConfidence: 0.9,
      });

      const allFacts = [
        { ...mockFactoid, subject: 'JavaScript' },
        { ...mockFactoid, subject: 'Java' },
      ];

      factoidsRepository.findBySubject.mockResolvedValue(null);
      factoidsRepository.findByChatId.mockResolvedValue(allFacts);
      naturalLanguageService.calculateSimilarity
        .mockResolvedValueOnce(0.7) // Below threshold
        .mockResolvedValueOnce(0.4); // Below threshold

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.factoid).toBeUndefined();
      expect(result.confidence).toBeUndefined();
    });

    it('should normalize subject for consistent matching', async () => {
      // Arrange
      const query = new FindFactQuery({
        chatId: 'test-chat-123',
        subject: '  TypeScript  ',
        minConfidence: 0.8,
      });

      naturalLanguageService.normalizeText.mockReturnValue('typescript');
      factoidsRepository.findBySubject.mockResolvedValue(mockFactoid);

      // Act
      await handler.execute(query);

      // Assert
      expect(naturalLanguageService.normalizeText).toHaveBeenCalledWith(
        '  TypeScript  ',
      );
    });
  });
});
