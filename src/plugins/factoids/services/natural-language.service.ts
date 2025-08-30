import { Injectable, Logger } from '@nestjs/common';
import {
  FACT_PATTERNS,
  QUESTION_PATTERNS,
  SimilarityAlgorithm,
  MIN_CONFIDENCE_THRESHOLD,
} from '../factoids.constants';
import type {
  INaturalLanguageService,
  FactExtractionResult,
  QuestionExtractionResult,
} from '../factoids.types';

@Injectable()
export class NaturalLanguageService implements INaturalLanguageService {
  private readonly logger = new Logger(NaturalLanguageService.name);

  extractFact(text: string): Promise<FactExtractionResult | null> {
    // First try to match with original text to preserve case
    for (const pattern of FACT_PATTERNS) {
      const match = text.match(pattern);
      if (match && match[1] && match[2]) {
        const subject = match[1].trim();
        const predicate = match[2].trim();

        // Skip if either part is too short or too long
        if (subject.length < 2 || predicate.length < 2) {
          continue;
        }
        if (subject.length > 100 || predicate.length > 500) {
          continue;
        }

        // Calculate confidence based on pattern match quality
        const confidence = this.calculatePatternConfidence(
          text,
          pattern,
          match,
        );

        if (confidence >= MIN_CONFIDENCE_THRESHOLD) {
          this.logger.debug(
            `Extracted fact: ${subject} -> ${predicate} (confidence: ${confidence})`,
          );

          return Promise.resolve({
            subject: this.cleanText(subject),
            predicate: this.cleanText(predicate),
            confidence,
          });
        }
      }
    }

    return Promise.resolve(null);
  }

  extractQuestion(text: string): Promise<QuestionExtractionResult | null> {
    // Try to match with original text to preserve case
    for (const pattern of QUESTION_PATTERNS) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const subject = match[1].trim();

        // Skip if subject is too short or too long
        if (subject.length < 2 || subject.length > 100) {
          continue;
        }

        const questionType = this.getQuestionType(pattern);
        const confidence = this.calculatePatternConfidence(
          text,
          pattern,
          match,
        );

        if (confidence >= MIN_CONFIDENCE_THRESHOLD) {
          this.logger.debug(
            `Extracted question: ${questionType} about ${subject} (confidence: ${confidence})`,
          );

          return Promise.resolve({
            subject: this.cleanText(subject),
            questionType,
            confidence,
          });
        }
      }
    }

    return Promise.resolve(null);
  }

  calculateSimilarity(
    text1: string,
    text2: string,
    algorithm: SimilarityAlgorithm = SimilarityAlgorithm.LEVENSHTEIN,
  ): Promise<number> {
    const normalized1 = this.normalizeText(text1);
    const normalized2 = this.normalizeText(text2);

    switch (algorithm) {
      case SimilarityAlgorithm.EXACT:
        return Promise.resolve(normalized1 === normalized2 ? 1.0 : 0.0);

      case SimilarityAlgorithm.LEVENSHTEIN:
        return Promise.resolve(
          this.calculateLevenshteinSimilarity(normalized1, normalized2),
        );

      case SimilarityAlgorithm.SEMANTIC:
        // For now, fall back to Levenshtein
        // In a production system, you might integrate with OpenAI embeddings or similar
        return Promise.resolve(
          this.calculateLevenshteinSimilarity(normalized1, normalized2),
        );

      default:
        return Promise.resolve(
          this.calculateLevenshteinSimilarity(normalized1, normalized2),
        );
    }
  }

  normalizeText(text: string): string {
    return (
      text
        .toLowerCase()
        .trim()
        // Remove extra whitespace
        .replace(/\s+/g, ' ')
        // Remove common punctuation
        .replace(/[.,!?;:'"()[\]{}]/g, '')
        // Remove diacritics/accents
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
    );
  }

  private cleanText(text: string): string {
    return (
      text
        .trim()
        // Normalize whitespace but preserve original case and basic punctuation
        .replace(/\s+/g, ' ')
        // Remove leading/trailing punctuation except for meaningful ones
        .replace(/^[.,!?;:'"()[\]{}]+|[.,!?;:'"()[\]{}]+$/g, '')
    );
  }

  private restoreCase(cleanedText: string, originalText: string): string {
    // Return cleaned version of the original text to preserve case
    return this.cleanText(originalText.trim());
  }

  private calculatePatternConfidence(
    text: string,
    pattern: RegExp,
    match: RegExpMatchArray,
  ): number {
    // Base confidence from pattern strength
    let confidence = 0.8;

    // Adjust based on match quality
    const matchLength = match[0].length;
    const textLength = text.length;
    const coverage = matchLength / textLength;

    // Higher coverage = higher confidence (up to a point)
    if (coverage > 0.8) {
      confidence += 0.1;
    } else if (coverage < 0.3) {
      confidence -= 0.2;
    }

    // Adjust based on captured groups quality
    const groups = match.slice(1).filter(Boolean);
    if (groups.length >= 2) {
      confidence += 0.1;
    }

    // Ensure confidence is within bounds
    return Math.max(0, Math.min(1, confidence));
  }

  private getQuestionType(pattern: RegExp): string {
    const patternString = pattern.toString();

    if (patternString.includes('what')) return 'what';
    if (patternString.includes('who')) return 'who';
    if (patternString.includes('where')) return 'where';
    if (patternString.includes('when')) return 'when';
    if (patternString.includes('why')) return 'why';
    if (patternString.includes('how')) return 'how';

    return 'general';
  }

  private calculateLevenshteinSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;
    if (str1.length === 0 || str2.length === 0) return 0.0;

    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);

    return 1 - distance / maxLength;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1, // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }
}
