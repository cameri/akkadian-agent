import { IMessage, ITelegramUpdate } from '../telegram.types';
import { TelegramUpdate } from './telegram-update';

describe('Update', () => {
  const createMockMessage = (id: number): IMessage => ({
    message_id: id,
    date: Date.now(),
    chat: {
      id: 123,
      type: 'private',
    },
    new_chat_title: '',
    reply_markup: {
      inline_keyboard: [],
    },
  });

  it('should be defined', () => {
    const update = new TelegramUpdate({
      update_id: 1,
    });
    expect(update).toBeDefined();
  });

  it('should copy properties from the provided update object', () => {
    const updateData: ITelegramUpdate = {
      update_id: 123,
      message: createMockMessage(1),
    };

    const update = new TelegramUpdate(updateData);

    expect(update.update_id).toBe(123);
    expect(update.message).toEqual(updateData.message);
  });

  describe('effective_message', () => {
    it('should return message if available', () => {
      const mockMessage = createMockMessage(1);
      const update = new TelegramUpdate({
        update_id: 1,
        message: mockMessage,
      });

      expect(update.effective_message).toBe(mockMessage);
    });

    it('should return edited_message if message is not available', () => {
      const mockMessage = createMockMessage(2);
      const update = new TelegramUpdate({
        update_id: 1,
        edited_message: mockMessage,
      });

      expect(update.effective_message).toBe(mockMessage);
    });

    it('should return channel_post if message and edited_message are not available', () => {
      const mockMessage = createMockMessage(3);
      const update = new TelegramUpdate({
        update_id: 1,
        channel_post: mockMessage,
      });

      expect(update.effective_message).toBe(mockMessage);
    });

    it('should return edited_channel_post if message, edited_message, and channel_post are not available', () => {
      const mockMessage = createMockMessage(4);
      const update = new TelegramUpdate({
        update_id: 1,
        edited_channel_post: mockMessage,
      });

      expect(update.effective_message).toBe(mockMessage);
    });

    it('should return undefined if no message types are available', () => {
      const update = new TelegramUpdate({
        update_id: 1,
      });

      expect(update.effective_message).toBeUndefined();
    });

    it('should cache the effective message after first access', () => {
      const mockMessage = createMockMessage(5);
      const update = new TelegramUpdate({
        update_id: 1,
        message: mockMessage,
      });

      const firstAccess = update.effective_message;

      update.message = createMockMessage(6);

      expect(update.effective_message).toBe(firstAccess);
    });

    it('should prioritize message over other message types', () => {
      const mockMessage = createMockMessage(1);
      const mockEditedMessage = createMockMessage(2);
      const mockChannelPost = createMockMessage(3);
      const mockEditedChannelPost = createMockMessage(4);

      const update = new TelegramUpdate({
        update_id: 1,
        message: mockMessage,
        edited_message: mockEditedMessage,
        channel_post: mockChannelPost,
        edited_channel_post: mockEditedChannelPost,
      });

      expect(update.effective_message).toBe(mockMessage);
    });

    it('should prioritize edited_message over channel types when message is not available', () => {
      const mockEditedMessage = createMockMessage(2);
      const mockChannelPost = createMockMessage(3);
      const mockEditedChannelPost = createMockMessage(4);

      const update = new TelegramUpdate({
        update_id: 1,
        edited_message: mockEditedMessage,
        channel_post: mockChannelPost,
        edited_channel_post: mockEditedChannelPost,
      });

      expect(update.effective_message).toBe(mockEditedMessage);
    });

    it('should prioritize channel_post over edited_channel_post when message and edited_message are not available', () => {
      const mockChannelPost = createMockMessage(3);
      const mockEditedChannelPost = createMockMessage(4);

      const update = new TelegramUpdate({
        update_id: 1,
        channel_post: mockChannelPost,
        edited_channel_post: mockEditedChannelPost,
      });

      expect(update.effective_message).toBe(mockChannelPost);
    });
  });
});
