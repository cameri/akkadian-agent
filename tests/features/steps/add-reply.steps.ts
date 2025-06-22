import { Given, Then, When } from '@cucumber/cucumber';
import { CommandBus } from '@nestjs/cqrs';
import { HttpStatusCode } from 'axios';
import assert from 'node:assert/strict';
import { ReplyRepository } from '../../../src/plugins/simple-replies/simple-replies.repository';
import { TestWorld } from './types';

let repository: ReplyRepository;
// let telegramResponse: { reply_text: string };

Given('I am a whitelisted Telegram user', function (this: TestWorld) {
  repository = this.app.get(ReplyRepository);
});

When(
  'I send a message {string} to the bot',
  async function (this: TestWorld, message: string) {
    const update = {
      update_id: 1,
      message: {
        message_id: 1,
        from: {
          id: 12345,
        },
        chat: {
          id: 12345,
        },
        text: message,
      },
    };

    this.telegramScope
      .get('/getUpdates')
      .once()
      .reply(HttpStatusCode.Ok, {
        ok: true,
        result: [update],
      });

    this.telegramScope
      .post(
        '/sendMessage',
        ({ chat_id, text }) =>
          chat_id === 12345 && /reply for \w+ added/i.test(text),
      )
      .once()
      .reply(HttpStatusCode.Ok, {});

    await new Promise<void>((resolve, reject) => {
      this.app.get(CommandBus).subscribe({
        next: (command) => {
          console.log('GOT COMMAND', command);
          resolve();
        },
        error: reject,
      });
    });
  },
);

Then('the bot should save the reply', async function () {
  const savedReply = await repository.findOneByPattern('hello');
  assert(savedReply, 'Reply should be saved in the database');
});

Then('respond with a success message', function () {
  // assert(
  //   telegramResponse.reply_text.includes('Success'),
  //   'Response should include success message',
  // );
});

Then(
  'the bot should respond with an error message about invalid format',
  function () {
    // assert(
    //   telegramResponse.reply_text.includes('invalid format'),
    //   'Response should include invalid format error message',
    // );
  },
);
