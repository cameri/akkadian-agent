import { Test, TestingModule } from '@nestjs/testing';
import { PatternMatchingService } from './pattern-matching.service';
import { NaturalLanguageService } from './natural-language.service';
import { createMock } from '@golevelup/ts-jest';
import type {
  FactExtractionResult,
  QuestionExtractionResult,
} from '../factoids.types';

describe('PatternMatchingService', () => {
  let service: PatternMatchingService;
  let naturalLanguageService: jest.Mocked<NaturalLanguageService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatternMatchingService,
        {
          provide: NaturalLanguageService,
          useValue: createMock<NaturalLanguageService>(),
        },
      ],
    }).compile();

    service = module.get<PatternMatchingService>(PatternMatchingService);
    naturalLanguageService = module.get(NaturalLanguageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('matchFactPattern', () => {
    it('should extract fact from valid fact statement', async () => {
      // Arrange
      const text = 'TypeScript is a programming language';
      const expectedResult: FactExtractionResult = {
        subject: 'TypeScript',
        predicate: 'is a programming language',
        confidence: 0.9,
      };

      naturalLanguageService.extractFact.mockResolvedValue(expectedResult);

      // Act
      const result = await service.matchFactPattern(text);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(naturalLanguageService.extractFact).toHaveBeenCalledWith(text);
    });

    it('should return null for invalid fact statement', async () => {
      // Arrange
      const text = 'Hello, how are you?';

      naturalLanguageService.extractFact.mockResolvedValue(null);

      // Act
      const result = await service.matchFactPattern(text);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle extraction errors gracefully', async () => {
      // Arrange
      const text = 'TypeScript is great';

      naturalLanguageService.extractFact.mockRejectedValue(
        new Error('Extraction failed'),
      );

      // Act & Assert
      await expect(service.matchFactPattern(text)).rejects.toThrow(
        'Extraction failed',
      );
    });
  });

  describe('matchQuestionPattern', () => {
    it('should extract question from valid question text', async () => {
      // Arrange
      const text = 'What is TypeScript?';
      const expectedResult: QuestionExtractionResult = {
        subject: 'TypeScript',
        questionType: 'what',
        confidence: 0.9,
      };

      naturalLanguageService.extractQuestion.mockResolvedValue(expectedResult);

      // Act
      const result = await service.matchQuestionPattern(text);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(naturalLanguageService.extractQuestion).toHaveBeenCalledWith(text);
    });

    it('should return null for invalid question', async () => {
      // Arrange
      const text = 'TypeScript is great';

      naturalLanguageService.extractQuestion.mockResolvedValue(null);

      // Act
      const result = await service.matchQuestionPattern(text);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle different question types', async () => {
      // Arrange
      const testCases = [
        {
          text: 'Who is Linus Torvalds?',
          expected: {
            subject: 'Linus Torvalds',
            questionType: 'who',
            confidence: 0.85,
          },
        },
        {
          text: 'Where is Node.js used?',
          expected: {
            subject: 'Node.js',
            questionType: 'where',
            confidence: 0.8,
          },
        },
      ];

      // Act & Assert
      for (const testCase of testCases) {
        naturalLanguageService.extractQuestion.mockResolvedValue(
          testCase.expected,
        );

        const result = await service.matchQuestionPattern(testCase.text);
        expect(result).toEqual(testCase.expected);
      }
    });
  });

  describe('isFactStatement', () => {
    it('should identify valid fact statements', async () => {
      // Arrange
      const validFacts = [
        'TypeScript is a programming language',
        'API means Application Programming Interface',
        'Python refers to a programming language',
        'CPU stands for Central Processing Unit',
        'JavaScript was created by Brendan Eich',
        'React represents a UI library',
      ];

      naturalLanguageService.normalizeText.mockImplementation((text) =>
        text.toLowerCase(),
      );

      // Act & Assert
      for (const fact of validFacts) {
        const result = await service.isFactStatement(fact);
        expect(result).toBe(true);
      }
    });

    it('should reject invalid fact statements', async () => {
      // Arrange
      const invalidFacts = [
        'Hello there!',
        'What is TypeScript?',
        'How are you today?',
        'A is B', // Too short
        'x'.repeat(200), // Too long subject/predicate
        'Thanks for helping',
        'Good morning',
      ];

      naturalLanguageService.normalizeText.mockImplementation((text) =>
        text.toLowerCase(),
      );

      // Act & Assert
      for (const fact of invalidFacts) {
        const result = await service.isFactStatement(fact);
        expect(result).toBe(false);
      }
    });

    it('should validate subject and predicate length constraints', async () => {
      // Arrange
      const shortSubject = 'A is a programming language'; // Subject too short
      const longSubject = 'x'.repeat(101) + ' is a language'; // Subject too long
      const longPredicate = 'TypeScript is ' + 'x'.repeat(501); // Predicate too long

      naturalLanguageService.normalizeText.mockImplementation((text) =>
        text.toLowerCase(),
      );

      // Act & Assert
      expect(await service.isFactStatement(shortSubject)).toBe(false);
      expect(await service.isFactStatement(longSubject)).toBe(false);
      expect(await service.isFactStatement(longPredicate)).toBe(false);
    });

    it('should normalize text before pattern matching', async () => {
      // Arrange
      const text = '  TypeScript  IS  a programming language  ';

      naturalLanguageService.normalizeText.mockReturnValue(
        'typescript is a programming language',
      );

      // Act
      const result = await service.isFactStatement(text);

      // Assert
      expect(result).toBe(true);
      expect(naturalLanguageService.normalizeText).toHaveBeenCalledWith(text);
    });
  });

  describe('isQuestion', () => {
    it('should identify valid questions', async () => {
      // Arrange
      const validQuestions = [
        'What is TypeScript?',
        'Who is Linus Torvalds?',
        'Where is JavaScript used?',
        'When was Python created?',
        'How does React work?',
        'Why is TypeScript popular?',
      ];

      naturalLanguageService.normalizeText.mockImplementation((text) =>
        text.toLowerCase(),
      );

      // Act & Assert
      for (const question of validQuestions) {
        const result = await service.isQuestion(question);
        expect(result).toBe(true);
      }
    });

    it('should reject non-questions', async () => {
      // Arrange
      const nonQuestions = [
        'TypeScript is great',
        'Hello there!',
        'Good morning',
        'Thanks for helping',
        'I like programming',
        'This is a statement',
      ];

      naturalLanguageService.normalizeText.mockImplementation((text) =>
        text.toLowerCase(),
      );

      // Act & Assert
      for (const nonQuestion of nonQuestions) {
        const result = await service.isQuestion(nonQuestion);
        expect(result).toBe(false);
      }
    });

    it('should normalize text before pattern matching', async () => {
      // Arrange
      const text = '  WHAT  IS  TypeScript?  ';

      naturalLanguageService.normalizeText.mockReturnValue(
        'what is typescript?',
      );

      // Act
      const result = await service.isQuestion(text);

      // Assert
      expect(result).toBe(true);
      expect(naturalLanguageService.normalizeText).toHaveBeenCalledWith(text);
    });
  });

  describe('performance characteristics', () => {
    it('should handle pattern matching efficiently', async () => {
      // Arrange
      const texts = Array(100)
        .fill(null)
        .map((_, i) => `Subject${i} is predicate${i}`);

      naturalLanguageService.normalizeText.mockImplementation((text) =>
        text.toLowerCase(),
      );

      // Act
      const startTime = Date.now();
      const promises = texts.map((text) => service.isFactStatement(text));
      await Promise.all(promises);
      const executionTime = Date.now() - startTime;

      // Assert
      expect(executionTime).toBeLessThan(100); // Should be very fast
    });

    it('should cache normalized text results', async () => {
      // Arrange
      const text = 'TypeScript is a programming language';

      naturalLanguageService.normalizeText.mockReturnValue(
        'typescript is a programming language',
      );

      // Act
      await service.isFactStatement(text);
      await service.isQuestion(text);

      // Assert
      expect(naturalLanguageService.normalizeText).toHaveBeenCalledTimes(2);
      expect(naturalLanguageService.normalizeText).toHaveBeenCalledWith(text);
    });
  });

  describe('edge cases', () => {
    it('should handle empty strings', async () => {
      // Arrange
      const emptyText = '';

      naturalLanguageService.normalizeText.mockReturnValue('');

      // Act
      const isFactResult = await service.isFactStatement(emptyText);
      const isQuestionResult = await service.isQuestion(emptyText);

      // Assert
      expect(isFactResult).toBe(false);
      expect(isQuestionResult).toBe(false);
    });

    it('should handle special characters', async () => {
      // Arrange
      const specialText = 'C++ is a programming language!';

      naturalLanguageService.normalizeText.mockReturnValue(
        'c++ is a programming language!',
      );

      // Act
      const result = await service.isFactStatement(specialText);

      // Assert
      expect(result).toBe(true);
    });

    it('should handle unicode characters', async () => {
      // Arrange
      const unicodeText = 'Café is a French word';

      naturalLanguageService.normalizeText.mockReturnValue(
        'cafe is a french word',
      );

      // Act
      const result = await service.isFactStatement(unicodeText);

      // Assert
      expect(result).toBe(true);
    });

    it('should handle multiple spaces and formatting', async () => {
      // Arrange
      const messyText = '  TypeScript   is     a   programming    language  ';

      naturalLanguageService.normalizeText.mockReturnValue(
        'typescript is a programming language',
      );

      // Act
      const result = await service.isFactStatement(messyText);

      // Assert
      expect(result).toBe(true);
    });
  });
});
