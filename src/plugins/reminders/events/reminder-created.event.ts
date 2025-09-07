import { IEvent } from '@nestjs/cqrs';
import type { IReminder } from '../reminders.types';

export class ReminderCreatedEvent implements IEvent {
  constructor(
    public readonly reminder: IReminder,
    public readonly userId: string,
    public readonly chatId: string,
  ) {}
}
