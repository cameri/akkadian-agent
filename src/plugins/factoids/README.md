# Factoids Plugin

A comprehensive knowledge management plugin for the Akkadian Agent that enables natural language fact learning and querying across chat platforms.

## Features

### Core Functionality
- **Natural Language Fact Learning**: Recognizes fact patterns like "X is Y", "X means Y", "X refers to Y"
- **Question Answering**: Responds to questions like "What is X?", "Who is Y?"
- **Chat-Scoped Knowledge**: Each chat maintains its own knowledge base
- **Cross-Platform Support**: Works on both Telegram and Nostr
- **Performance Optimized**: Sub-100ms processing, sub-50ms query responses

### Advanced Features
- **Similarity Matching**: Finds related facts using Levenshtein distance
- **Multi-Level Caching**: Memory cache with configurable TTL
- **Pattern Recognition**: Sophisticated regex patterns for fact extraction
- **Confidence Scoring**: Each fact has a confidence score for reliability
- **MongoDB Integration**: Optimized storage with proper indexing

## Usage

### Learning Facts

#### Command-Based Learning
```
/learn TypeScript is a programming language
/teach API means Application Programming Interface
/fact MongoDB is a NoSQL database
```

#### Natural Language Recognition
The plugin automatically recognizes fact patterns in natural conversation:
- "TypeScript is a programming language"
- "API means Application Programming Interface"
- "Docker represents containerization technology"

### Querying Facts

Ask questions using natural language:
- "What is TypeScript?"
- "Who is Linus Torvalds?"
- "What does API mean?"

## Architecture

### Domain Model
- **Factoid**: Core knowledge entity with subject, predicate, and confidence
- **ChatKnowledge**: Chat-level settings and metadata
- **FactPattern**: Configurable patterns for fact recognition

### CQRS Implementation
- **Commands**: `LearnFactCommand`, `ProcessMessageCommand`
- **Queries**: `FindFactQuery`, `SearchFactsQuery`
- **Handlers**: Separate command and query handlers for scalability

### Services
- **NaturalLanguageService**: Text processing and pattern matching
- **PatternMatchingService**: Fact and question recognition
- **CacheService**: High-performance caching layer

## Configuration

### Environment Variables
Configure through chat-specific settings:
- `learningEnabled`: Enable/disable fact learning
- `maxFacts`: Maximum facts per chat (default: 10,000)
- `minConfidence`: Minimum confidence threshold (default: 0.6)

### Performance Settings
- Query timeout: 50ms
- Processing timeout: 100ms
- Cache TTL: 5 minutes

## Examples

### Basic Fact Learning
```typescript
// User input: "/learn React is a JavaScript library"
// Result: Fact stored with high confidence

// User input: "What is React?"
// Response: "React is a JavaScript library"
```

### Similarity Matching
```typescript
// Stored fact: "JavaScript is a programming language"
// User query: "What is JS?"
// Result: Finds similar fact using fuzzy matching
```

### Confidence Scoring
```typescript
// Clear fact: "TypeScript is a programming language" (confidence: 0.9)
// Ambiguous: "That thing is cool" (confidence: 0.3, rejected)
```

## Performance

- **Fact Storage**: Optimized MongoDB schema with compound indexes
- **Query Speed**: Text search with MongoDB full-text indexing
- **Memory Usage**: Configurable cache limits and cleanup
- **Scalability**: Supports 10,000+ facts per chat

## Error Handling

- Graceful degradation for parsing failures
- Timeout protection for long-running operations
- Validation for fact length and content quality
- Cache failure fallbacks to database queries

## Future Enhancements

- **Semantic Matching**: Integration with AI embeddings
- **Fact Relationships**: Link related facts together
- **Source Tracking**: Track who taught which facts
- **Export/Import**: Backup and restore knowledge bases
- **Analytics**: Usage statistics and popular facts