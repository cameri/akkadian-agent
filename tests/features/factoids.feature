Feature: Factoids Plugin
  As a user of the bot
  I want to teach and query facts
  So that the bot can remember and share knowledge

  Background:
    Given the factoids plugin is enabled
    And the bot is connected to a test chat

  Scenario: Learning a new fact
    When a user sends "/learn TypeScript is a programming language"
    Then the bot should acknowledge the fact was learned
    And the fact "TypeScript is a programming language" should be stored

  Scenario: Answering a question about a known fact
    Given the bot knows "TypeScript is a programming language"
    When a user asks "What is TypeScript?"
    Then the bot should respond with "TypeScript is a programming language"

  Scenario: Handling unknown facts
    Given the bot has no knowledge about "Rust"
    When a user asks "What is Rust?"
    Then the bot should respond that it doesn't know about Rust

  Scenario: Learning facts from natural language
    When a user states "JavaScript is a dynamic language"
    And a user sends "/learn JavaScript is a dynamic language"
    Then the bot should acknowledge the fact was learned

  Scenario: Updating existing facts
    Given the bot knows "Python is a language"
    When a user sends "/learn Python is a powerful programming language"
    Then the bot should acknowledge the fact was updated
    And querying "What is Python?" should return the updated information