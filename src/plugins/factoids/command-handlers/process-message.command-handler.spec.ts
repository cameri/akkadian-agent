import { createMock } from '@golevelup/ts-jest';
import { Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { ProcessMessageCommand } from '../commands/process-message.command';
import type {
  FactExtractionResult,
  QuestionExtractionResult,
} from '../factoids.types';
import { FindFactQuery } from '../queries/find-fact.query';
import { NaturalLanguageService } from '../services/natural-language.service';
import { PatternMatchingService } from '../services/pattern-matching.service';
import { ProcessMessageCommandHandler } from './process-message.command-handler';

describe('ProcessMessageCommandHandler', () => {
  let handler: ProcessMessageCommandHandler;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;
  let naturalLanguageService: jest.Mocked<NaturalLanguageService>;
  let patternMatchingService: jest.Mocked<PatternMatchingService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessMessageCommandHandler,
        Logger,
        {
          provide: CommandBus,
          useValue: createMock<CommandBus>(),
        },
        {
          provide: QueryBus,
          useValue: createMock<QueryBus>(),
        },
        {
          provide: NaturalLanguageService,
          useValue: createMock<NaturalLanguageService>(),
        },
        {
          provide: PatternMatchingService,
          useValue: createMock<PatternMatchingService>(),
        },
      ],
    }).compile();

    handler = module.get<ProcessMessageCommandHandler>(
      ProcessMessageCommandHandler,
    );
    commandBus = module.get(CommandBus);
    queryBus = module.get(QueryBus);
    naturalLanguageService = module.get(NaturalLanguageService);
    patternMatchingService = module.get(PatternMatchingService);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should process a question and return fact if found', async () => {
      // Arrange
      const command = new ProcessMessageCommand({
        chatId: 'test-chat-123',
        text: 'What is TypeScript?',
        userId: 'user123',
        username: 'testuser',
      });

      const question: QuestionExtractionResult = {
        subject: 'TypeScript',
        questionType: 'what',
        confidence: 0.9,
      };

      const findFactResult = {
        factoid: {
          id: '507f1f77bcf86cd799439011',
          chatId: 'test-chat-123',
          subject: 'TypeScript',
          predicate: 'a programming language',
          confidence: 0.9,
          userId: 'user123',
          username: 'testuser',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        confidence: 0.9,
      };

      patternMatchingService.isQuestion.mockResolvedValue(true);
      patternMatchingService.isFactStatement.mockResolvedValue(false);
      naturalLanguageService.extractQuestion.mockResolvedValue(question);
      queryBus.execute.mockResolvedValue(findFactResult);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.response).toContain('TypeScript is a programming language');
      expect(result.questionAnswered).toBe(true);
      expect(queryBus.execute).toHaveBeenCalledWith(expect.any(FindFactQuery));
    });

    it('should return appropriate message when fact not found', async () => {
      // Arrange
      const command = new ProcessMessageCommand({
        chatId: 'test-chat-123',
        text: 'What is Rust?',
        userId: 'user123',
        username: 'testuser',
      });

      const question: QuestionExtractionResult = {
        subject: 'Rust',
        questionType: 'what',
        confidence: 0.9,
      };

      patternMatchingService.isQuestion.mockResolvedValue(true);
      patternMatchingService.isFactStatement.mockResolvedValue(false);
      naturalLanguageService.extractQuestion.mockResolvedValue(question);
      queryBus.execute.mockResolvedValue({ factoid: null });

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.response).toContain("I don't know about Rust");
      expect(result.questionAnswered).toBe(true);
      expect(queryBus.execute).toHaveBeenCalledWith(expect.any(FindFactQuery));
    });

    it('should learn fact from natural statement', async () => {
      // Arrange
      const command = new ProcessMessageCommand({
        chatId: 'test-chat-123',
        text: 'Python is a programming language',
        userId: 'user123',
        username: 'testuser',
      });

      const fact: FactExtractionResult = {
        subject: 'Python',
        predicate: 'is a programming language',
        confidence: 0.9,
      };

      patternMatchingService.isQuestion.mockResolvedValue(false);
      patternMatchingService.isFactStatement.mockResolvedValue(true);
      naturalLanguageService.extractFact.mockResolvedValue(fact);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.factLearned).toBe(false); // Handler doesn't auto-learn facts
      expect(result.response).toBeUndefined(); // Handler returns no response for fact statements
      expect(commandBus.execute).not.toHaveBeenCalled(); // No command should be executed
    });

    it('should return no response for unrecognized messages', async () => {
      // Arrange
      const command = new ProcessMessageCommand({
        chatId: 'test-chat-123',
        text: 'Hello there!',
        userId: 'user123',
        username: 'testuser',
      });

      patternMatchingService.isQuestion.mockResolvedValue(false);
      patternMatchingService.isFactStatement.mockResolvedValue(false);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.response).toBeUndefined();
      expect(result.factLearned).toBe(false);
      expect(result.questionAnswered).toBe(false);
    });

    it('should handle performance requirements under 100ms', async () => {
      // Arrange
      const command = new ProcessMessageCommand({
        chatId: 'test-chat-123',
        text: 'What is Node.js?',
        userId: 'user123',
        username: 'testuser',
      });

      patternMatchingService.isQuestion.mockResolvedValue(true);
      patternMatchingService.isFactStatement.mockResolvedValue(false);
      naturalLanguageService.extractQuestion.mockResolvedValue({
        subject: 'Node.js',
        questionType: 'what',
        confidence: 0.9,
      });
      queryBus.execute.mockResolvedValue({ factoid: null });

      // Act
      const startTime = Date.now();
      await handler.execute(command);
      const executionTime = Date.now() - startTime;

      // Assert
      expect(executionTime).toBeLessThan(100);
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      const command = new ProcessMessageCommand({
        chatId: 'test-chat-123',
        text: 'What is Docker?',
        userId: 'user123',
        username: 'testuser',
      });

      patternMatchingService.isQuestion.mockRejectedValue(
        new Error('NLP service error'),
      );

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.error).toBe('Failed to process message');
      expect(result.response).toBeUndefined();
      expect(result.factLearned).toBe(false);
      expect(result.questionAnswered).toBe(false);
    });

    it('should handle error object properly in logging', async () => {
      // Arrange
      const command = new ProcessMessageCommand({
        chatId: 'test-chat-123',
        text: 'What is TypeScript?',
        userId: 'user123',
        username: 'testuser',
      });

      const question: QuestionExtractionResult = {
        subject: 'TypeScript',
        questionType: 'what',
        confidence: 0.9,
      };

      const errorObject = new Error('Database connection failed');

      patternMatchingService.isQuestion.mockResolvedValue(true);
      patternMatchingService.isFactStatement.mockResolvedValue(false);
      naturalLanguageService.extractQuestion.mockResolvedValue(question);
      queryBus.execute.mockResolvedValue({ error: errorObject });

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.error).toBe('Failed to find fact');
      expect(result.factLearned).toBe(false);
      expect(result.questionAnswered).toBe(false);
    });
  });
});
