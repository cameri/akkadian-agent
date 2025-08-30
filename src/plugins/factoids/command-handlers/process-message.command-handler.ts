import { Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { ProcessMessageCommand } from '../commands/process-message.command';
import { RESPONSE_TEMPLATES } from '../factoids.constants';
import type { ProcessMessageCommandResult } from '../factoids.types';
import { FindFactQuery } from '../queries/find-fact.query';
import { NaturalLanguageService } from '../services/natural-language.service';
import { PatternMatchingService } from '../services/pattern-matching.service';

@CommandHandler(ProcessMessageCommand)
export class ProcessMessageCommandHandler
  implements ICommandHandler<ProcessMessageCommand, ProcessMessageCommandResult>
{
  private readonly logger = new Logger(ProcessMessageCommandHandler.name);

  constructor(
    private readonly queryBus: QueryBus,
    private readonly patternMatchingService: PatternMatchingService,
    private readonly naturalLanguageService: NaturalLanguageService,
  ) {}

  async execute(
    command: ProcessMessageCommand,
  ): Promise<ProcessMessageCommandResult> {
    try {
      this.logger.debug(
        `Processing message for chat ${command.chatId}: ${command.text}`,
      );

      // Check if this is a question
      if (await this.patternMatchingService.isQuestion(command.text)) {
        return this.handleQuestion(command);
      }

      // Check if this is a fact statement
      if (await this.patternMatchingService.isFactStatement(command.text)) {
        return this.handleFactStatement(command);
      }

      // No action needed for this message
      return {
        response: undefined,
        factLearned: false,
        questionAnswered: false,
      };
    } catch (error) {
      this.logger.error(`Error processing message: ${error}`, error);
      return {
        error: 'Failed to process message',
        factLearned: false,
        questionAnswered: false,
      };
    }
  }

  private async handleQuestion(
    command: ProcessMessageCommand,
  ): Promise<ProcessMessageCommandResult> {
    const questionData = await this.naturalLanguageService.extractQuestion(
      command.text,
    );

    if (!questionData) {
      return {
        response: RESPONSE_TEMPLATES.PARSING_ERROR,
        factLearned: false,
        questionAnswered: false,
      };
    }

    // Query for the fact
    const findFactQuery = new FindFactQuery({
      chatId: command.chatId,
      subject: questionData.subject,
    });

    const { factoid, error } = await this.queryBus.execute(findFactQuery);

    if (error) {
      this.logger.error(`Error finding fact: ${error}`);
      return {
        error: typeof error === 'string' ? error : 'Failed to find fact',
        factLearned: false,
        questionAnswered: false,
      };
    }

    if (!factoid) {
      this.logger.warn(`No fact found for question: ${questionData.subject}`);
      const response = RESPONSE_TEMPLATES.FACT_NOT_FOUND.replaceAll(
        '{subject}',
        questionData.subject,
      );
      this.logger.warn(`Sending response: ${response}`);

      return {
        response,
        factLearned: false,
        questionAnswered: true,
      };
    }

    const response = `${factoid.subject} is ${factoid.predicate}`;

    this.logger.log(
      `Answered question about ${factoid.subject} for chat ${command.chatId}`,
    );

    return {
      response,
      factLearned: false,
      questionAnswered: true,
    };
  }

  private async handleFactStatement(
    command: ProcessMessageCommand,
  ): Promise<ProcessMessageCommandResult> {
    const factData = await this.naturalLanguageService.extractFact(
      command.text,
    );

    if (!factData) {
      return {
        response: RESPONSE_TEMPLATES.PARSING_ERROR,
        factLearned: false,
        questionAnswered: false,
      };
    }

    // For now, we'll just acknowledge fact statements without learning them automatically
    // This prevents spam and gives users control over what gets learned
    return {
      response: undefined,
      factLearned: false,
      questionAnswered: false,
    };
  }
}
