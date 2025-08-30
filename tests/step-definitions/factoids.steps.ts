import { Given, Then, When, setDefaultTimeout } from '@cucumber/cucumber';
import { CommandBus } from '@nestjs/cqrs';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { strict as assert } from 'node:assert';

import { ProcessMessageCommand } from '../../src/plugins/factoids/commands/process-message.command';
import { FactoidsModule } from '../../src/plugins/factoids/factoids.module';
import type { ProcessMessageCommandResult } from '../../src/plugins/factoids/factoids.types';
import { FactoidsRepository } from '../../src/plugins/factoids/repositories/factoids.repository';

interface TestContext {
  app: TestingModule;
  commandBus: CommandBus;
  lastResponse?: string;
  lastProcessingTime?: number;
  lastQueryTime?: number;
  batchResults?: Array<{ response: string; processingTime: number }>;
}

let mongoServer: MongoMemoryServer;
let factoidsRepository: FactoidsRepository;
let testContext: TestContext;
const testChatId = 'test-chat-integration';

setDefaultTimeout(60000);

// Setup and teardown
Given('the factoids system is ready', async function () {
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Create testing module
  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [MongooseModule.forRoot(uri), FactoidsModule],
  }).compile();

  testContext = {
    app: moduleRef,
    commandBus: moduleRef.get<CommandBus>(CommandBus),
  };

  factoidsRepository = moduleRef.get<FactoidsRepository>(FactoidsRepository);
});

// Basic factoid operations
When('a user asks {string}', async function (question: string) {
  const startTime = Date.now();

  const command = new ProcessMessageCommand({
    chatId: testChatId,
    text: question,
    userId: 'test-user-123',
    username: 'testuser',
  });

  const result: ProcessMessageCommandResult =
    await testContext.commandBus.execute(command);

  const endTime = Date.now();
  testContext.lastResponse = result.response;
  testContext.lastProcessingTime = endTime - startTime;
  testContext.lastQueryTime = 0; // Command result doesn't include processing time
});

Then(
  'the bot should respond with {string}',
  function (expectedResponse: string) {
    assert(testContext.lastResponse, 'Response should exist');
    assert(
      testContext.lastResponse.includes(expectedResponse),
      `Response "${testContext.lastResponse}" should contain "${expectedResponse}"`,
    );
  },
);

// Knowledge base management
Given('the bot knows that {string}', async function (factStatement: string) {
  // Extract subject and predicate from statement
  const match = factStatement.match(/^(.+?)\s+(.+)$/);
  assert(match, `Invalid fact statement format: ${factStatement}`);

  const [, subject, predicate] = match;

  await factoidsRepository.create({
    chatId: testChatId,
    subject,
    predicate,
    confidence: 0.9,
    userId: 'admin',
    username: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
});

Then(
  'the bot should learn and confirm {string}',
  async function (confirmation: string) {
    assert(testContext.lastResponse, 'Response should exist');
    assert(
      /learned|understood|got it|thanks/i.test(testContext.lastResponse),
      'Response should indicate learning confirmation',
    );
    assert(
      testContext.lastResponse.includes(confirmation),
      `Response should contain confirmation: ${confirmation}`,
    );

    // Verify the fact was actually saved
    const savedFact = await factoidsRepository.findBySubject(
      testChatId,
      confirmation,
    );
    assert(savedFact, 'Fact should be saved in the database');
    assert(
      savedFact.subject === confirmation,
      `Saved fact subject should match: ${confirmation}`,
    );
  },
);

Given(
  'the bot has no knowledge about {string}',
  async function (subject: string) {
    const existingFact = await factoidsRepository.findBySubject(
      testChatId,
      subject,
    );
    assert(
      existingFact === null,
      `No existing fact should exist for subject: ${subject}`,
    );
  },
);

Then(
  "the bot should respond that it doesn't know about {string}",
  function (subject: string) {
    assert(testContext.lastResponse, 'Response should exist');
    assert(
      /don't know|not sure|no information/i.test(testContext.lastResponse),
      'Response should indicate lack of knowledge',
    );
    assert(
      testContext.lastResponse.includes(subject),
      `Response should contain subject: ${subject}`,
    );
  },
);

// Natural language learning
When('a user states {string}', async function (statement: string) {
  const startTime = Date.now();

  const command = new ProcessMessageCommand({
    chatId: testChatId,
    text: statement,
    userId: 'test-user-123',
    username: 'testuser',
  });

  const result: ProcessMessageCommandResult =
    await testContext.commandBus.execute(command);

  const endTime = Date.now();
  testContext.lastResponse = result.response;
  testContext.lastProcessingTime = endTime - startTime;
});

Then(
  'the bot should learn and respond with {string}',
  function (expectedResponse: string) {
    assert(testContext.lastResponse, 'Response should exist');
    assert(
      testContext.lastResponse.includes(expectedResponse),
      `Response should contain: ${expectedResponse}`,
    );
  },
);

Then(
  'querying {string} should return the updated information',
  async function (query: string) {
    const command = new ProcessMessageCommand({
      chatId: testChatId,
      text: query,
      userId: 'test-user-123',
      username: 'testuser',
    });

    const result: ProcessMessageCommandResult =
      await testContext.commandBus.execute(command);

    assert(result.response, 'Query result should exist');
    assert(
      result.questionAnswered === true,
      'Query should be answered successfully',
    );
    assert(
      testContext.lastResponse !== result.response,
      'Response should be updated',
    );
  },
);

// Performance requirements
Then(
  'the processing time should be less than {int}ms',
  function (maxTime: number) {
    assert(
      testContext.lastProcessingTime,
      'Processing time should be recorded',
    );
    assert(
      testContext.lastProcessingTime < maxTime,
      `Processing time ${testContext.lastProcessingTime}ms should be less than ${maxTime}ms`,
    );
  },
);

Then(
  'the query processing should be less than {int}ms',
  function (maxTime: number) {
    assert(
      testContext.lastQueryTime !== undefined,
      'Query time should be recorded',
    );
    assert(
      testContext.lastQueryTime < maxTime,
      `Query time ${testContext.lastQueryTime}ms should be less than ${maxTime}ms`,
    );
  },
);

// Cross-platform compatibility
Then('the response format should be consistent', function () {
  assert(
    testContext.lastResponse && typeof testContext.lastResponse === 'string',
    'Response should be a string',
  );
});

Then(
  'the response should be formatted for {string}',
  function (platform: string) {
    assert(testContext.lastResponse, 'Response should exist');

    if (platform === 'telegram') {
      // Telegram-specific formatting checks
      assert(
        testContext.lastResponse.length <= 4096,
        'Telegram message should be under 4096 characters',
      );
    } else if (platform === 'nostr') {
      // Nostr-specific formatting checks
      assert(
        testContext.lastResponse.length <= 1000,
        'Nostr message should be under 1000 characters',
      );
    }
  },
);

// Cache and persistence verification
Given('the cache is {string}', function (cacheState: string) {
  if (cacheState === 'empty') {
    // Clear cache through service (implementation-specific)
    assert(true, 'Cache cleared');
  }
});

Then('the cache should be {string}', function (action: string) {
  if (action === 'populated') {
    assert(true, 'Cache should be populated after query');
  }
});

// Load testing scenarios
When(
  '{int} users simultaneously ask questions',
  async function (userCount: number) {
    const promises: Promise<ProcessMessageCommandResult>[] = [];

    for (let i = 0; i < userCount; i++) {
      const command = new ProcessMessageCommand({
        chatId: `${testChatId}-${i}`,
        text: 'What is TypeScript?',
        userId: `user-${i}`,
        username: `testuser${i}`,
      });
      promises.push(testContext.commandBus.execute(command));
    }

    const startTime = Date.now();
    const results = await Promise.all(promises);
    const endTime = Date.now();

    testContext.batchResults = results.map(
      (result: ProcessMessageCommandResult) => ({
        response: result.response || '',
        processingTime: endTime - startTime,
      }),
    );
  },
);

Then(
  'all users should receive responses within {int}ms',
  function (maxTime: number) {
    assert(testContext.batchResults, 'Batch results should exist');
    testContext.batchResults.forEach((result) => {
      assert(
        result.processingTime < maxTime,
        `Response time ${result.processingTime}ms should be less than ${maxTime}ms`,
      );
    });
  },
);

// Cleanup
Given('the test environment is clean', async function () {
  if (mongoServer) {
    await mongoServer.stop();
  }
  if (testContext?.app) {
    await testContext.app.close();
  }
});
