import { IEvent } from '@nestjs/cqrs';
import type { IReminder } from '../reminders.types';

export class ReminderDeliveredEvent implements IEvent {
  constructor(
    public readonly reminder: IReminder,
    public readonly deliveredAt: Date,
    public readonly transport: string,
  ) {}
}
