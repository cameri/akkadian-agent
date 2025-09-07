import { IEvent } from '@nestjs/cqrs';
import type { IReminder } from '../reminders.types';

export class ReminderFailedEvent implements IEvent {
  constructor(
    public readonly reminder: IReminder,
    public readonly error: string,
    public readonly attempts: number,
  ) {}
}
