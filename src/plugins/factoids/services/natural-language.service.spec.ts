import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { NaturalLanguageService } from './natural-language.service';
import { SimilarityAlgorithm } from '../factoids.constants';

describe('NaturalLanguageService', () => {
  let service: NaturalLanguageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NaturalLanguageService, Logger],
    }).compile();

    service = module.get<NaturalLanguageService>(NaturalLanguageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('extractFact', () => {
    it('should extract fact from "X is Y" pattern', async () => {
      // Arrange
      const text = 'TypeScript is a programming language';

      // Act
      const result = await service.extractFact(text);

      // Assert
      expect(result).toBeDefined();
      expect(result?.subject).toBe('TypeScript');
      expect(result?.predicate).toBe('a programming language');
      expect(result?.confidence).toBeGreaterThan(0.6);
    });

    it('should extract fact from "X means Y" pattern', async () => {
      // Arrange
      const text = 'API means Application Programming Interface';

      // Act
      const result = await service.extractFact(text);

      // Assert
      expect(result).toBeDefined();
      expect(result?.subject).toBe('API');
      expect(result?.predicate).toBe('Application Programming Interface');
      expect(result?.confidence).toBeGreaterThan(0.6);
    });

    it('should handle case insensitive matching', async () => {
      // Arrange
      const text = 'javascript is a dynamic language';

      // Act
      const result = await service.extractFact(text);

      // Assert
      expect(result).toBeDefined();
      expect(result?.subject).toBe('javascript');
      expect(result?.predicate).toBe('a dynamic language');
    });

    it('should return null for non-fact statements', async () => {
      // Arrange
      const text = 'Hello, how are you today?';

      // Act
      const result = await service.extractFact(text);

      // Assert
      expect(result).toBeNull();
    });

    it('should reject facts that are too short', async () => {
      // Arrange
      const text = 'A is B';

      // Act
      const result = await service.extractFact(text);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('extractQuestion', () => {
    it('should extract question from "What is X?" pattern', async () => {
      // Arrange
      const text = 'What is TypeScript?';

      // Act
      const result = await service.extractQuestion(text);

      // Assert
      expect(result).toBeDefined();
      expect(result?.subject).toBe('TypeScript');
      expect(result?.questionType).toBe('what');
      expect(result?.confidence).toBeGreaterThan(0.6);
    });

    it('should extract question from "Who is X?" pattern', async () => {
      // Arrange
      const text = 'Who is Linus Torvalds?';

      // Act
      const result = await service.extractQuestion(text);

      // Assert
      expect(result).toBeDefined();
      expect(result?.subject).toBe('Linus Torvalds');
      expect(result?.questionType).toBe('who');
    });

    it('should handle case insensitive questions', async () => {
      // Arrange
      const text = 'what is javascript?';

      // Act
      const result = await service.extractQuestion(text);

      // Assert
      expect(result).toBeDefined();
      expect(result?.subject).toBe('javascript');
    });

    it('should return null for non-questions', async () => {
      // Arrange
      const text = 'TypeScript is great';

      // Act
      const result = await service.extractQuestion(text);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('calculateSimilarity', () => {
    it('should return 1.0 for exact matches', async () => {
      // Arrange
      const text1 = 'TypeScript';
      const text2 = 'TypeScript';

      // Act
      const similarity = await service.calculateSimilarity(
        text1,
        text2,
        SimilarityAlgorithm.EXACT,
      );

      // Assert
      expect(similarity).toBe(1.0);
    });

    it('should return 0.0 for exact non-matches', async () => {
      // Arrange
      const text1 = 'TypeScript';
      const text2 = 'JavaScript';

      // Act
      const similarity = await service.calculateSimilarity(
        text1,
        text2,
        SimilarityAlgorithm.EXACT,
      );

      // Assert
      expect(similarity).toBe(0.0);
    });

    it('should calculate Levenshtein similarity', async () => {
      // Arrange
      const text1 = 'TypeScript';
      const text2 = 'JavaScript';

      // Act
      const similarity = await service.calculateSimilarity(
        text1,
        text2,
        SimilarityAlgorithm.LEVENSHTEIN,
      );

      // Assert
      expect(similarity).toBeGreaterThan(0.3);
      expect(similarity).toBeLessThan(1.0);
    });

    it('should handle case insensitive similarity', async () => {
      // Arrange
      const text1 = 'TypeScript';
      const text2 = 'typescript';

      // Act
      const similarity = await service.calculateSimilarity(
        text1,
        text2,
        SimilarityAlgorithm.LEVENSHTEIN,
      );

      // Assert
      expect(similarity).toBe(1.0);
    });
  });

  describe('normalizeText', () => {
    it('should convert to lowercase', () => {
      // Arrange
      const text = 'TypeScript';

      // Act
      const normalized = service.normalizeText(text);

      // Assert
      expect(normalized).toBe('typescript');
    });

    it('should remove extra whitespace', () => {
      // Arrange
      const text = '  TypeScript   is   great  ';

      // Act
      const normalized = service.normalizeText(text);

      // Assert
      expect(normalized).toBe('typescript is great');
    });

    it('should remove punctuation', () => {
      // Arrange
      const text = 'TypeScript, is great!';

      // Act
      const normalized = service.normalizeText(text);

      // Assert
      expect(normalized).toBe('typescript is great');
    });

    it('should remove diacritics', () => {
      // Arrange
      const text = 'Café';

      // Act
      const normalized = service.normalizeText(text);

      // Assert
      expect(normalized).toBe('cafe');
    });
  });
});
