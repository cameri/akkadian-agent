Feature: Enhanced Factoids Plugin Testing
  As a QA engineer
  I want to comprehensively test the factoids plugin
  So that it meets production quality standards

  Background:
    Given the factoids plugin is enabled
    And the bot is connected to a test chat

  Scenario: Performance requirements for message processing
    Given the system is under normal load
    When a user asks "What is TypeScript?"
    Then the response time should be less than 100ms
    And the query processing should be less than 50ms

  Scenario: Cross-platform compatibility on Telegram
    Given the bot is running on telegram
    When a user asks "What is JavaScript?"
    Then the bot should respond appropriately
    And the response should be formatted for telegram

  Scenario: Cross-platform compatibility on Nostr
    Given the bot is running on nostr  
    When a user asks "What is JavaScript?"
    Then the bot should respond appropriately
    And the response should be formatted for nostr

  Scenario: Error handling when database is unavailable
    Given the bot knows "Node.js is a runtime"
    When the database is unavailable
    And a user asks "What is Node.js?"
    Then the bot should handle the error gracefully

  Scenario: Cache efficiency for repeated queries
    Given the cache is empty
    When a user asks "What is TypeScript?" 
    Then the cache should be populated
    When another user asks "What is TypeScript?"
    Then the response should come from cache
    And the response time should be faster

  Scenario: Concurrent user access
    Given the bot knows "React is a library"
    When 10 users simultaneously ask "What is React?"
    Then all users should receive responses within 200ms
    And all responses should be consistent

  Scenario: Memory management with large fact database
    Given the bot has learned 1000 facts
    When users make various queries
    Then memory usage should remain stable
    And response times should not degrade

  Scenario: Input validation and sanitization
    When a user sends malicious input "<script>alert('xss')</script>"
    Then the bot should sanitize the input
    And no security vulnerability should be exposed

  Scenario: Rate limiting protection  
    Given a user has made many requests
    When the user exceeds the rate limit
    Then the bot should throttle responses
    And provide appropriate feedback

  Scenario: Database transaction integrity
    Given multiple users are learning facts simultaneously
    When they submit conflicting information
    Then the database should maintain consistency
    And no data corruption should occur

  Scenario: Natural language processing accuracy
    When a user states "Python is an excellent programming language for data science"
    Then the bot should extract the correct subject-predicate relationship
    And store it with appropriate confidence levels

  Scenario: Semantic similarity matching
    Given the bot knows "JavaScript is a programming language"
    When a user asks "What is JS?"
    Then the bot should recognize the similarity
    And provide the relevant information

  Scenario: Multi-language fact storage
    When users teach facts in different languages
    Then the bot should store them correctly
    And maintain proper character encoding

  Scenario: Long-running operation handling
    When processing a complex query that takes time
    Then the bot should not block other operations
    And should handle timeouts gracefully