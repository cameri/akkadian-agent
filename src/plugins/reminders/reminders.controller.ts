import { Controller, Logger, OnModuleInit } from '@nestjs/common';
import {
  CommandBus,
  QueryBus,
  EventsHandler,
  IEventHandler,
} from '@nestjs/cqrs';
import { MessagePattern, Ctx, Payload } from '@nestjs/microservices';
import { pipe, path, test } from 'ramda';
import { TelegramUpdate } from '../../transports/telegram/ext/telegram-update';
import { TextResponse } from '../../transports/telegram/ext/text-response';
import { TelegramServerTransport } from '../../transports/telegram/telegram.constants';
import type { IMessage } from '../../transports/telegram/telegram.types';
import { ReminderDeliveredEvent } from './events';
import { CreateReminderCommand } from './commands/create-reminder.command';
import { ListRemindersQuery } from './queries/list-reminders.query';
import { CancelReminderCommand } from './commands/cancel-reminder.command';
import { SetTimezoneCommand } from './commands/set-timezone.command';
import { REMINDER_STATUS } from './reminders.constants';
import type { IReminder } from './reminders.types';

// Message patterns for Telegram command routing
const RemindMeCommandPattern = pipe(
  path(['effective_message', 'text']),
  test(/^\/remindme(?:@\w+)?\s+(.+)/i),
);

const ListRemindersCommandPattern = pipe(
  path(['effective_message', 'text']),
  test(/^\/reminders(?:@\w+)?\s*(list)?$/i),
);

const CancelReminderCommandPattern = pipe(
  path(['effective_message', 'text']),
  test(/^\/reminders(?:@\w+)?\s+cancel\s+(.+)/i),
);

const SetTimezoneCommandPattern = pipe(
  path(['effective_message', 'text']),
  test(/^\/reminders(?:@\w+)?\s+timezone\s+(.+)/i),
);

/**
 * Reminders controller handles events and provides plugin entry point
 * The actual reminder functionality is accessed through CQRS commands and queries
 */
@Controller('reminders')
export class RemindersController implements OnModuleInit {
  private readonly logger = new Logger(RemindersController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  onModuleInit(): void {
    this.logger.log('Reminders plugin initialized successfully');
  }

  @MessagePattern(RemindMeCommandPattern, TelegramServerTransport)
  async handleRemindMeCommand(
    @Payload() message: IMessage,
    @Ctx() _context: TelegramUpdate,
  ): Promise<TextResponse> {
    try {
      this.logger.debug(
        `Processing /remindme command from user ${message.from?.id}`,
      );

      const text = message.text || '';
      const match = text.match(/^\/remindme(?:@\w+)?\s+(.+)/i);

      if (!match) {
        return new TextResponse({
          chat_id: message.chat.id,
          text: 'Please provide a time and optional message. Example: /remindme tomorrow 3pm Buy groceries',
        });
      }

      const input = match[1].trim();
      const chatId = message.chat.id.toString();
      const userId = message.from?.id.toString();

      if (!userId) {
        return new TextResponse({
          chat_id: message.chat.id,
          text: 'Sorry, I could not identify the user.',
        });
      }

      // Parse the input to separate time from message
      // This is a simple implementation - the DateParserService will handle the actual parsing
      const parts = input.split(/\s+/);
      let timeInput = input;
      let reminderMessage = '';

      // Try to detect if there's a message after the time
      // For now, we'll assume the first few words are time-related
      const timeWords = [
        'in',
        'at',
        'on',
        'tomorrow',
        'today',
        'next',
        'this',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ];
      const messageStartIndex = parts.findIndex(
        (word, index) =>
          index > 0 &&
          !timeWords.some((tw) =>
            word.toLowerCase().includes(tw.toLowerCase()),
          ) &&
          !/^\d+/.test(word) &&
          ![
            'am',
            'pm',
            'minutes',
            'hours',
            'days',
            'weeks',
            'months',
            'years',
          ].includes(word.toLowerCase()),
      );

      if (messageStartIndex > 0) {
        timeInput = parts.slice(0, messageStartIndex).join(' ');
        reminderMessage = parts.slice(messageStartIndex).join(' ');
      }

      // If it's a reply to another message, use that as the reminder context
      let originalMessageId: number | undefined;
      let originalMessageText: string | undefined;

      if (message.reply_to_message) {
        originalMessageId = message.reply_to_message.message_id;
        originalMessageText = message.reply_to_message.text;
        // Use the original message as the reminder if no custom message provided
        if (!reminderMessage && originalMessageText) {
          reminderMessage = `Remember this message: "${originalMessageText}"`;
        }
      }

      // Ensure we have some message content
      if (!reminderMessage && !originalMessageText) {
        reminderMessage = 'Reminder';
      }

      const command = new CreateReminderCommand({
        userId,
        chatId,
        title: reminderMessage || 'Reminder',
        message: reminderMessage,
        dateTimeText: timeInput,
        timezone: undefined, // will be detected/defaulted by the service
        transport: 'telegram',
        transportSpecific: {
          originalMessageId,
          originalMessageText,
        },
      });

      const result = await this.commandBus.execute(command);

      if (result.success) {
        return new TextResponse({
          chat_id: message.chat.id,
          text: result.message || 'Reminder created successfully',
        });
      } else {
        return new TextResponse({
          chat_id: message.chat.id,
          text: `❌ ${result.error}`,
        });
      }
    } catch (error) {
      this.logger.error('Error handling /remindme command:', error);
      return new TextResponse({
        chat_id: message.chat.id,
        text: '❌ Sorry, there was an error setting up your reminder. Please try again.',
      });
    }
  }

  @MessagePattern(ListRemindersCommandPattern, TelegramServerTransport)
  async handleListRemindersCommand(
    @Payload() message: IMessage,
    @Ctx() _context: TelegramUpdate,
  ): Promise<TextResponse> {
    try {
      this.logger.debug(
        `Processing /reminders list command from user ${message.from?.id}`,
      );

      const chatId = message.chat.id.toString();
      const userId = message.from?.id.toString();

      if (!userId) {
        return new TextResponse({
          chat_id: message.chat.id,
          text: 'Sorry, I could not identify the user.',
        });
      }

      const query = new ListRemindersQuery({
        userId,
        chatId,
        status: REMINDER_STATUS.PENDING,
        limit: 10,
        offset: 0,
      });
      const result = await this.queryBus.execute(query);

      if (!result || !result.reminders || result.reminders.length === 0) {
        return new TextResponse({
          chat_id: message.chat.id,
          text: '📋 You have no active reminders.',
        });
      }

      let response = '📋 Your active reminders:\n\n';
      result.reminders.forEach((reminder: IReminder, index: number) => {
        const date = new Date(reminder.scheduledFor).toLocaleString();
        response += `${index + 1}. 🔔 "${reminder.title}"\n`;
        response += `   📅 ${date}\n`;
        if (reminder.recurrence && reminder.recurrence !== 'none') {
          response += `   🔁 Recurring (${reminder.recurrence})\n`;
        }
        response += '\n';
      });

      return new TextResponse({
        chat_id: message.chat.id,
        text: response.trim(),
      });
    } catch (error) {
      this.logger.error('Error handling /reminders list command:', error);
      return new TextResponse({
        chat_id: message.chat.id,
        text: '❌ Sorry, there was an error retrieving your reminders. Please try again.',
      });
    }
  }

  @MessagePattern(CancelReminderCommandPattern, TelegramServerTransport)
  async handleCancelReminderCommand(
    @Payload() message: IMessage,
    @Ctx() _context: TelegramUpdate,
  ): Promise<TextResponse> {
    try {
      this.logger.debug(
        `Processing /reminders cancel command from user ${message.from?.id}`,
      );

      const text = message.text || '';
      const match = text.match(/^\/reminders(?:@\w+)?\s+cancel\s+(.+)/i);

      if (!match) {
        return new TextResponse({
          chat_id: message.chat.id,
          text: 'Please provide a reminder ID to cancel. Example: /reminders cancel 1',
        });
      }

      const reminderIdInput = match[1].trim();
      const chatId = message.chat.id.toString();
      const userId = message.from?.id.toString();

      if (!userId) {
        return new TextResponse({
          chat_id: message.chat.id,
          text: 'Sorry, I could not identify the user.',
        });
      }

      // Parse reminder ID (could be a number from the list or actual ObjectId)
      let reminderId = reminderIdInput;

      // If it's a number, we need to get the actual reminder ID from the user's list
      if (/^\d+$/.test(reminderIdInput)) {
        const index = parseInt(reminderIdInput) - 1;
        const query = new ListRemindersQuery({
          userId,
          chatId,
          status: REMINDER_STATUS.PENDING,
          limit: 50,
          offset: 0,
        });
        const reminders = await this.queryBus.execute(query);

        if (
          !reminders ||
          !reminders.reminders ||
          index < 0 ||
          index >= reminders.reminders.length
        ) {
          return new TextResponse({
            chat_id: message.chat.id,
            text: '❌ Invalid reminder number. Use /reminders list to see your reminders.',
          });
        }

        const selectedReminder = reminders.reminders[index];
        if (!selectedReminder._id) {
          return new TextResponse({
            chat_id: message.chat.id,
            text: '❌ Invalid reminder ID. Please try again.',
          });
        }

        reminderId = selectedReminder._id;
      }

      const command = new CancelReminderCommand({
        reminderId,
        userId,
      });
      const result = await this.commandBus.execute(command);

      if (result.success) {
        return new TextResponse({
          chat_id: message.chat.id,
          text: '✅ Reminder cancelled successfully.',
        });
      } else {
        return new TextResponse({
          chat_id: message.chat.id,
          text: `❌ ${result.error}`,
        });
      }
    } catch (error) {
      this.logger.error('Error handling /reminders cancel command:', error);
      return new TextResponse({
        chat_id: message.chat.id,
        text: '❌ Sorry, there was an error cancelling your reminder. Please try again.',
      });
    }
  }

  @MessagePattern(SetTimezoneCommandPattern, TelegramServerTransport)
  async handleSetTimezoneCommand(
    @Payload() message: IMessage,
    @Ctx() _context: TelegramUpdate,
  ): Promise<TextResponse> {
    try {
      this.logger.debug(
        `Processing /reminders timezone command from user ${message.from?.id}`,
      );

      const text = message.text || '';
      const match = text.match(/^\/reminders(?:@\w+)?\s+timezone\s+(.+)/i);

      if (!match) {
        return new TextResponse({
          chat_id: message.chat.id,
          text: 'Please provide a timezone. Example: /reminders timezone America/New_York',
        });
      }

      const timezone = match[1].trim();
      const chatId = message.chat.id.toString();
      const userId = message.from?.id.toString();

      if (!userId) {
        return new TextResponse({
          chat_id: message.chat.id,
          text: 'Sorry, I could not identify the user.',
        });
      }

      const command = new SetTimezoneCommand({
        userId,
        chatId,
        timezone,
      });
      const result = await this.commandBus.execute(command);

      if (result.success) {
        return new TextResponse({
          chat_id: message.chat.id,
          text: `✅ Timezone set to ${timezone}`,
        });
      } else {
        return new TextResponse({
          chat_id: message.chat.id,
          text: `❌ ${result.error}`,
        });
      }
    } catch (error) {
      this.logger.error('Error handling /reminders timezone command:', error);
      return new TextResponse({
        chat_id: message.chat.id,
        text: '❌ Sorry, there was an error setting your timezone. Please try again.',
      });
    }
  }
}

/**
 * Event handler for reminder delivery events
 * This handler coordinates with transport modules to actually deliver reminders
 */
@EventsHandler(ReminderDeliveredEvent)
export class ReminderDeliveredEventHandler
  implements IEventHandler<ReminderDeliveredEvent>
{
  private readonly logger = new Logger(ReminderDeliveredEventHandler.name);

  handle(event: ReminderDeliveredEvent): void {
    try {
      this.logger.debug(
        `Processing reminder delivery event for reminder ${event.reminder._id} via ${event.transport}`,
      );

      // The transport modules (Telegram, Nostr) should listen for this event
      // and handle the actual delivery based on event.transport

      // For now, we'll just log the reminder that needs to be delivered
      // In a complete implementation, this would emit a more specific transport event
      // or call transport-specific delivery services

      this.logReminderForDelivery(event.reminder);

      this.logger.log(
        `Reminder delivery event processed for reminder ${event.reminder._id}`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing reminder delivery event for reminder ${event.reminder._id}:`,
        error,
      );
    }
  }

  /**
   * Logs the reminder content for delivery
   * In a production system, this would be replaced with actual transport delivery
   */
  private logReminderForDelivery(reminder: IReminder): void {
    const message = this.formatReminderMessage(reminder);

    this.logger.log(
      `REMINDER DELIVERY [${reminder.transport}] to ${reminder.chatId}: ${message}`,
    );
  }

  /**
   * Formats a reminder for display/delivery
   */
  private formatReminderMessage(reminder: IReminder): string {
    let message = `🔔 Reminder: ${reminder.title}`;

    if (reminder.message) {
      message += `\n${reminder.message}`;
    }

    return message;
  }
}
