import { createMock } from '@golevelup/ts-jest';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SearchFactsQuery } from '../queries/search-facts.query';
import { SearchFactsQueryHandler } from './search-facts.query-handler';
import { FactoidsRepository } from '../repositories/factoids.repository';
import { NaturalLanguageService } from '../services/natural-language.service';
import { CacheService } from '../../../cache';
import type { IFactoid } from '../factoids.types';
import { QUERY_TIMEOUT_MS } from '../factoids.constants';

describe('SearchFactsQueryHandler', () => {
  let handler: SearchFactsQueryHandler;
  let factoidsRepository: jest.Mocked<FactoidsRepository>;
  let naturalLanguageService: jest.Mocked<NaturalLanguageService>;
  let cacheService: jest.Mocked<CacheService>;

  const mockFactoids: IFactoid[] = [
    {
      id: '507f1f77bcf86cd799439011',
      chatId: 'test-chat-123',
      subject: 'TypeScript',
      predicate: 'is a programming language',
      confidence: 0.9,
      userId: 'user123',
      username: 'testuser',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '507f1f77bcf86cd799439012',
      chatId: 'test-chat-123',
      subject: 'JavaScript',
      predicate: 'is a dynamic language',
      confidence: 0.85,
      userId: 'user456',
      username: 'otheruser',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchFactsQueryHandler,
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

    handler = module.get<SearchFactsQueryHandler>(SearchFactsQueryHandler);
    factoidsRepository = module.get(FactoidsRepository);
    naturalLanguageService = module.get(NaturalLanguageService);
    cacheService = module.get(CacheService);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should search facts by text query', async () => {
      // Arrange
      const query = new SearchFactsQuery({
        chatId: 'test-chat-123',
        query: 'programming',
        limit: 10,
        // offset not supported in interface 0,
      });

      factoidsRepository.searchByText.mockResolvedValue(mockFactoids);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.factoids).toBeDefined();
      expect(result.factoids).toEqual(mockFactoids);
      expect(result.total).toBe(2);
      expect(factoidsRepository.searchByText).toHaveBeenCalledWith(
        'test-chat-123',
        'programming',
        10,
        0,
      );
    });

    it('should return cached results when available', async () => {
      // Arrange
      const query = new SearchFactsQuery({
        chatId: 'test-chat-123',
        query: 'programming',
        limit: 10,
        // offset not supported in interface 0,
      });

      const cachedResult = {
        facts: mockFactoids,
        total: 2,
      };

      cacheService.get.mockResolvedValue(cachedResult);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.factoids).toBeDefined();
      expect(result.factoids).toEqual(mockFactoids);
      expect(factoidsRepository.searchByText).not.toHaveBeenCalled();
    });

    it('should cache search results', async () => {
      // Arrange
      const query = new SearchFactsQuery({
        chatId: 'test-chat-123',
        query: 'programming',
        limit: 10,
        // offset not supported in interface 0,
      });

      cacheService.get.mockResolvedValue(null);
      factoidsRepository.searchByText.mockResolvedValue(mockFactoids);

      // Act
      await handler.execute(query);

      // Assert
      expect(cacheService.set).toHaveBeenCalledWith(
        expect.stringContaining('search:test-chat-123:programming'),
        { facts: mockFactoids, total: 2 },
        expect.any(Number),
      );
    });

    it('should handle empty search results', async () => {
      // Arrange
      const query = new SearchFactsQuery({
        chatId: 'test-chat-123',
        query: 'nonexistent',
        limit: 10,
        // offset not supported in interface 0,
      });

      factoidsRepository.searchByText.mockResolvedValue([]);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.factoids).toBeDefined();
      expect(result.factoids).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should respect pagination parameters', async () => {
      // Arrange
      const query = new SearchFactsQuery({
        chatId: 'test-chat-123',
        query: 'language',
        limit: 1,
        // offset not supported in interface 1,
      });

      const paginatedResults = [mockFactoids[1]];
      factoidsRepository.searchByText.mockResolvedValue(paginatedResults);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.factoids).toBeDefined();
      expect(result.factoids).toEqual(paginatedResults);
      expect(factoidsRepository.searchByText).toHaveBeenCalledWith(
        'test-chat-123',
        'language',
        1,
        1,
      );
    });

    it('should meet query performance requirements under 50ms', async () => {
      // Arrange
      const query = new SearchFactsQuery({
        chatId: 'test-chat-123',
        query: 'typescript',
        limit: 10,
        // offset not supported in interface 0,
      });

      factoidsRepository.searchByText.mockResolvedValue(mockFactoids);

      // Act
      const startTime = Date.now();
      await handler.execute(query);
      const executionTime = Date.now() - startTime;

      // Assert
      expect(executionTime).toBeLessThan(QUERY_TIMEOUT_MS);
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const query = new SearchFactsQuery({
        chatId: 'test-chat-123',
        query: 'programming',
        limit: 10,
        // offset not supported in interface 0,
      });

      cacheService.get.mockResolvedValue(null);
      factoidsRepository.searchByText.mockRejectedValue(
        new Error('Database search failed'),
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.factoids).toEqual([]);
      expect(result.error).toContain('Database search failed');
      expect(result.factoids).toEqual([]);
    });

    it('should normalize search text for consistent results', async () => {
      // Arrange
      const query = new SearchFactsQuery({
        chatId: 'test-chat-123',
        query: '  Programming Language  ',
        limit: 10,
        // offset not supported in interface 0,
      });

      naturalLanguageService.normalizeText.mockReturnValue(
        'programming language',
      );
      factoidsRepository.searchByText.mockResolvedValue(mockFactoids);

      // Act
      await handler.execute(query);

      // Assert
      expect(naturalLanguageService.normalizeText).toHaveBeenCalledWith(
        '  Programming Language  ',
      );
      expect(factoidsRepository.searchByText).toHaveBeenCalledWith(
        'test-chat-123',
        'programming language',
        10,
        0,
      );
    });

    it('should filter results by minimum confidence when specified', async () => {
      // Arrange
      const query = new SearchFactsQuery({
        chatId: 'test-chat-123',
        query: 'language',
        limit: 10,
        // offset not supported in interface 0,
        minConfidence: 0.9,
      });

      const highConfidenceResults = mockFactoids.filter(
        (f) => f.confidence >= 0.9,
      );
      factoidsRepository.searchByText.mockResolvedValue(mockFactoids);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.factoids).toBeDefined();
      expect(result.factoids).toEqual(highConfidenceResults);
      expect(result.total).toBe(1);
    });

    it('should sort results by confidence in descending order', async () => {
      // Arrange
      const query = new SearchFactsQuery({
        chatId: 'test-chat-123',
        query: 'language',
        limit: 10,
        // offset not supported in interface 0,
      });

      const unsortedFacts = [mockFactoids[1], mockFactoids[0]]; // Lower confidence first
      factoidsRepository.searchByText.mockResolvedValue(unsortedFacts);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.factoids).toBeDefined();
      expect(result.factoids[0].confidence).toBeGreaterThan(
        result.factoids[1].confidence,
      );
    });
  });
});
