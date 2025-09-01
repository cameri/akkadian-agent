import type { SimilarityAlgorithm } from './factoids.constants';

// Core domain interfaces
export interface IFactoid {
  id?: string;
  chatId: string;
  subject: string;
  predicate: string;
  confidence: number;
  userId?: string;
  username?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface IFactPattern {
  id?: string;
  pattern: string;
  patternType: 'learning' | 'question';
  regex: string;
  priority: number;
  confidence: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IChatKnowledge {
  id?: string;
  chatId: string;
  factCount: number;
  lastActivity?: Date;
  settings?: {
    learningEnabled: boolean;
    maxFacts: number;
    minConfidence: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

// Command and Query interfaces
export interface LearnFactCommandArgs {
  chatId: string;
  text: string;
  userId?: string;
  username?: string;
}

export interface LearnFactCommandResult {
  success: boolean;
  factoid?: IFactoid;
  message?: string;
  error?: string;
}

export interface FindFactQueryArgs {
  chatId: string;
  subject: string;
  algorithm?: SimilarityAlgorithm;
  minConfidence?: number;
}

export interface FindFactQueryResult {
  factoid?: IFactoid;
  confidence?: number;
  error?: string;
}

export interface SearchFactsQueryArgs {
  chatId: string;
  query: string;
  limit?: number;
  algorithm?: SimilarityAlgorithm;
  minConfidence?: number;
}

export interface SearchFactsQueryResult {
  factoids: Array<{
    factoid: IFactoid;
    confidence: number;
  }>;
  total: number;
  error?: string;
}

export interface ProcessMessageCommandArgs {
  chatId: string;
  text: string;
  userId?: string;
  username?: string;
}

export interface ProcessMessageCommandResult {
  response?: string;
  factLearned?: boolean;
  questionAnswered?: boolean;
  error?: string;
}

// Repository interfaces
export interface IFactoidsRepository {
  create(factoid: IFactoid): Promise<IFactoid>;
  update(id: string, factoid: Partial<IFactoid>): Promise<IFactoid | null>;
  findBySubject(chatId: string, subject: string): Promise<IFactoid | null>;
  findByChatId(chatId: string, limit?: number): Promise<IFactoid[]>;
  searchByText(
    chatId: string,
    query: string,
    limit?: number,
    offset?: number,
  ): Promise<IFactoid[]>;
  delete(id: string): Promise<boolean>;
  countByChatId(chatId: string): Promise<number>;
}

export interface IFactPatternsRepository {
  findAll(): Promise<IFactPattern[]>;
  findByType(patternType: 'learning' | 'question'): Promise<IFactPattern[]>;
  create(pattern: IFactPattern): Promise<IFactPattern>;
  update(
    id: string,
    pattern: Partial<IFactPattern>,
  ): Promise<IFactPattern | null>;
}

export interface IChatKnowledgeRepository {
  findByChatId(chatId: string): Promise<IChatKnowledge | null>;
  create(knowledge: IChatKnowledge): Promise<IChatKnowledge>;
  update(
    id: string,
    knowledge: Partial<IChatKnowledge>,
  ): Promise<IChatKnowledge | null>;
  incrementFactCount(chatId: string): Promise<void>;
  decrementFactCount(chatId: string): Promise<void>;
}

// Service interfaces
export interface INaturalLanguageService {
  extractFact(text: string): Promise<{
    subject: string;
    predicate: string;
    confidence: number;
  } | null>;

  extractQuestion(text: string): Promise<{
    subject: string;
    questionType: string;
    confidence: number;
  } | null>;

  calculateSimilarity(
    text1: string,
    text2: string,
    algorithm?: SimilarityAlgorithm,
  ): Promise<number>;

  normalizeText(text: string): string;
}

export interface IPatternMatchingService {
  matchFactPattern(text: string): Promise<{
    subject: string;
    predicate: string;
    confidence: number;
  } | null>;

  matchQuestionPattern(text: string): Promise<{
    subject: string;
    questionType: string;
    confidence: number;
  } | null>;

  isFactStatement(text: string): Promise<boolean>;
  isQuestion(text: string): Promise<boolean>;
}

// Processing result types
export interface FactExtractionResult {
  subject: string;
  predicate: string;
  confidence: number;
}

export interface QuestionExtractionResult {
  subject: string;
  questionType: string;
  confidence: number;
}

// Semantic matching types
export interface SemanticMatch {
  text: string;
  confidence: number;
  algorithm: SimilarityAlgorithm;
}

// Configuration types
export interface FactoidsConfig {
  processing: {
    timeoutMs: number;
    minConfidence: number;
    maxFactsPerChat: number;
  };
  caching: {
    ttlSeconds: number;
    enabled: boolean;
  };
  similarity: {
    defaultAlgorithm: SimilarityAlgorithm;
    levenshteinThreshold: number;
    semanticThreshold: number;
  };
}
