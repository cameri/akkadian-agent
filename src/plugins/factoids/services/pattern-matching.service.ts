import { Injectable } from '@nestjs/common';
import { FACT_PATTERNS, QUESTION_PATTERNS } from '../factoids.constants';
import type {
  IPatternMatchingService,
  FactExtractionResult,
  QuestionExtractionResult,
} from '../factoids.types';
import { NaturalLanguageService } from './natural-language.service';

@Injectable()
export class PatternMatchingService implements IPatternMatchingService {
  constructor(
    private readonly naturalLanguageService: NaturalLanguageService,
  ) {}

  async matchFactPattern(text: string): Promise<FactExtractionResult | null> {
    return this.naturalLanguageService.extractFact(text);
  }

  async matchQuestionPattern(
    text: string,
  ): Promise<QuestionExtractionResult | null> {
    return this.naturalLanguageService.extractQuestion(text);
  }

  isFactStatement(text: string): Promise<boolean> {
    const normalizedText = this.naturalLanguageService.normalizeText(text);

    for (const pattern of FACT_PATTERNS) {
      const match = normalizedText.match(pattern);
      if (match && match[1] && match[2]) {
        // Quick validation of the match quality
        const subject = match[1].trim();
        const predicate = match[2].trim();

        if (
          subject.length >= 2 &&
          predicate.length >= 2 &&
          subject.length <= 100 &&
          predicate.length <= 500
        ) {
          return Promise.resolve(true);
        }
      }
    }

    return Promise.resolve(false);
  }

  isQuestion(text: string): Promise<boolean> {
    const normalizedText = this.naturalLanguageService.normalizeText(text);

    for (const pattern of QUESTION_PATTERNS) {
      const match = normalizedText.match(pattern);
      if (match && match[1]) {
        const subject = match[1].trim();

        if (subject.length >= 2 && subject.length <= 100) {
          return Promise.resolve(true);
        }
      }
    }

    return Promise.resolve(false);
  }
}
