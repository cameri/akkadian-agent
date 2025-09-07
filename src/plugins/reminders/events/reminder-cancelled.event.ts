import { IEvent } from '@nestjs/cqrs';
import type { IReminder } from '../reminders.types';

export class ReminderCancelledEvent implements IEvent {
  constructor(
    public readonly reminder: IReminder,
    public readonly cancelledBy: string,
    public readonly cancelledAt: Date,
  ) {}
}
