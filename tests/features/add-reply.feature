Feature: Add Reply
  As a Telegram user
  I want to add automated replies to specific patterns
  So that the bot can respond automatically to messages

  Scenario: Successfully adding a reply
    Given I am a whitelisted Telegram user
    When I send a message "/add_reply hello" to the bot
    Then the bot should save the reply
    And respond with a success message

  Scenario: Adding a reply with invalid format
    Given I am a whitelisted Telegram user
    When I send a message "/add_reply" to the bot
    Then the bot should respond with an error message about invalid format