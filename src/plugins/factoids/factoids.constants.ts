export const FactoidsCollectionName = 'factoids';
export const FactPatternsCollectionName = 'fact-patterns';
export const ChatKnowledgeCollectionName = 'chat-knowledge';

// Regular expressions for pattern matching
export const learnFactCommandRegExp =
  /^\/(?:learn|teach|fact)(?<bot>@[^\s]+)?\s+(?<fact>.+)$/i;

export const factStatementRegExp =
  /(?<subject>[^.!?]+?)\s+(?:is|are|was|were|means?|refers?\s+to|stands?\s+for)\s+(?<predicate>[^.!?]+)/i;

export const questionRegExp =
  /^(?:what|who|where|when|why|how|which)\s+(?:is|are|was|were|does|do|did|can|could|will|would|should|might|may)\s+(?<subject>[^?]+)\??$/i;

export const simpleQuestionRegExp =
  /^(?:what\s+(?:is|are)\s+(?<subject>[^?]+))\??$/i;

// Performance thresholds
export const QUERY_TIMEOUT_MS = 50;
export const PROCESSING_TIMEOUT_MS = 100;
export const CACHE_TTL_SECONDS = 300; // 5 minutes
export const MAX_FACTS_PER_CHAT = 10000;

// Pattern confidence thresholds
export const MIN_CONFIDENCE_THRESHOLD = 0.6;
export const HIGH_CONFIDENCE_THRESHOLD = 0.85;

// Cache keys
export const FACT_CACHE_PREFIX = 'fact:';
export const CHAT_CACHE_PREFIX = 'chat:';
export const PATTERN_CACHE_PREFIX = 'pattern:';

// Fact learning patterns as constants for performance
export const FACT_PATTERNS = [
  // "X is Y" patterns - exclude questions and conversational starts
  /^(?!(?:what|who|where|when|why|how|hello|hi|hey|good|thanks?|please|sorry|excuse)\s)([a-zA-Z][a-zA-Z0-9+#.\s-]{1,98}?)\s+(?:is|are)\s+([^?]{3,498})(?:[.!])?$/i,
  // "X means Y" patterns
  /^([a-zA-Z][a-zA-Z0-9+#.\s-]{1,98}?)\s+means?\s+([^?]{3,498})(?:[.!])?$/i,
  // "X refers to Y" patterns
  /^([a-zA-Z][a-zA-Z0-9+#.\s-]{1,98}?)\s+refers?\s+to\s+([^?]{3,498})(?:[.!])?$/i,
  // "X stands for Y" patterns
  /^([a-zA-Z][a-zA-Z0-9+#.\s-]{1,98}?)\s+stands?\s+for\s+([^?]{3,498})(?:[.!])?$/i,
  // "X was Y" patterns (past tense)
  /^(?!(?:what|who|where|when|why|how|hello|hi|hey|good|thanks?|please|sorry|excuse)\s)([a-zA-Z][a-zA-Z0-9+#.\s-]{1,98}?)\s+(?:was|were)\s+([^?]{3,498})(?:[.!])?$/i,
  // "X represents Y" patterns
  /^([a-zA-Z][a-zA-Z0-9+#.\s-]{1,98}?)\s+represents?\s+([^?]{3,498})(?:[.!])?$/i,
] as const;

// Question patterns for fact retrieval
export const QUESTION_PATTERNS = [
  // "What is X?" patterns
  /^what\s+(?:is|are)\s+(.+?)\??$/i,
  // "Who is X?" patterns
  /^who\s+(?:is|are|was|were)\s+(.+?)\??$/i,
  // "Where is X?" patterns
  /^where\s+(?:is|are|was|were)\s+(.+?)\??$/i,
  // "When is X?" patterns
  /^when\s+(?:is|are|was|were)\s+(.+?)\??$/i,
  // "How is X?" patterns (including "how does", "how do", "how can")
  /^how\s+(?:is|are|was|were|does|do|did|can|could|will|would)\s+(.+?)\??$/i,
  // "Why is X?" patterns
  /^why\s+(?:is|are|was|were)\s+(.+?)\??$/i,
] as const;

// Similarity algorithm types
export const SimilarityAlgorithm = {
  EXACT: 'exact',
  LEVENSHTEIN: 'levenshtein',
  SEMANTIC: 'semantic',
} as const;

export type SimilarityAlgorithm =
  (typeof SimilarityAlgorithm)[keyof typeof SimilarityAlgorithm];

// Response templates
export const RESPONSE_TEMPLATES = {
  FACT_LEARNED: "Got it! I'll remember that {subject} {predicate}.",
  FACT_UPDATED: "I've updated my knowledge about {subject}.",
  FACT_NOT_FOUND:
    'I don\'t know about {subject}. You can teach me by saying "{subject} is..."',
  QUESTION_ANSWERED: '{subject} {predicate}',
  PARSING_ERROR:
    'I couldn\'t understand that. Try saying something like "X is Y" or asking "What is X?"',
  STORAGE_ERROR: 'I had trouble saving that fact. Please try again.',
} as const;

export type ResponseTemplate =
  (typeof RESPONSE_TEMPLATES)[keyof typeof RESPONSE_TEMPLATES];
