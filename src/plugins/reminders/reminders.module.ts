import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '../../cache/cache.module';
import { DatabaseModule } from '../../database/database.module';
import { InstrumentationModule } from '../../instrumentation/instrumentation.module';

// Schemas
import { Reminder, ReminderSchema } from './schemas/reminder.schema';
import { ReminderJob, ReminderJobSchema } from './schemas/reminder-job.schema';

// Repositories
import { RemindersRepository } from './repositories/reminders.repository';
import { ReminderJobsRepository } from './repositories/reminder-jobs.repository';

// Services
import { DateParserService } from './services/date-parser.service';
import { TimezoneService } from './services/timezone.service';
import { ReminderSchedulerService } from './services/reminder-scheduler.service';

// Command Handlers
import { CreateReminderCommandHandler } from './command-handlers/create-reminder.command-handler';
import { CancelReminderCommandHandler } from './command-handlers/cancel-reminder.command-handler';
import { SetTimezoneCommandHandler } from './command-handlers/set-timezone.command-handler';

// Query Handlers
import { ListRemindersQueryHandler } from './query-handlers/list-reminders.query-handler';
import { GetReminderQueryHandler } from './query-handlers/get-reminder.query-handler';
import { GetUpcomingRemindersQueryHandler } from './query-handlers/get-upcoming-reminders.query-handler';

// Controller and Event Handlers
import {
  RemindersController,
  ReminderDeliveredEventHandler,
} from './reminders.controller';

@Module({
  imports: [
    InstrumentationModule,
    DatabaseModule,
    CacheModule,
    MongooseModule.forFeature([
      { name: Reminder.name, schema: ReminderSchema },
      { name: ReminderJob.name, schema: ReminderJobSchema },
    ]),
  ],
  providers: [
    // Repositories
    RemindersRepository,
    ReminderJobsRepository,

    // Services
    DateParserService,
    TimezoneService,
    ReminderSchedulerService,

    // Command Handlers
    CreateReminderCommandHandler,
    CancelReminderCommandHandler,
    SetTimezoneCommandHandler,

    // Query Handlers
    ListRemindersQueryHandler,
    GetReminderQueryHandler,
    GetUpcomingRemindersQueryHandler,

    // Event Handlers
    ReminderDeliveredEventHandler,
  ],
  controllers: [RemindersController],
  exports: [
    RemindersRepository,
    DateParserService,
    TimezoneService,
    ReminderSchedulerService,
  ],
})
export class RemindersModule {}
