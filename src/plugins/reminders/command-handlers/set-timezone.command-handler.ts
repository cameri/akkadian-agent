import { Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SetTimezoneCommand } from '../commands/set-timezone.command';
import type { SetTimezoneCommandResult } from '../reminders.types';
import { TimezoneService } from '../services/timezone.service';
import { RESPONSE_TEMPLATES } from '../reminders.constants';

@CommandHandler(SetTimezoneCommand)
export class SetTimezoneCommandHandler
  implements ICommandHandler<SetTimezoneCommand, SetTimezoneCommandResult>
{
  private readonly logger = new Logger(SetTimezoneCommandHandler.name);

  constructor(private readonly timezoneService: TimezoneService) {}

  async execute(
    command: SetTimezoneCommand,
  ): Promise<SetTimezoneCommandResult> {
    try {
      this.logger.debug(
        `Setting timezone ${command.timezone} for user ${command.userId}`,
      );

      // Set the user's timezone
      const result = await this.timezoneService.setUserTimezone(
        command.userId,
        command.chatId,
        command.timezone,
      );

      if (!result.success) {
        return {
          success: false,
          error: result.error || RESPONSE_TEMPLATES.INVALID_TIMEZONE,
        };
      }

      const responseMessage = RESPONSE_TEMPLATES.TIMEZONE_SET.replace(
        '{timezone}',
        this.timezoneService.getTimezoneDisplayName(command.timezone),
      );

      this.logger.log(
        `Successfully set timezone ${command.timezone} for user ${command.userId}`,
      );

      return {
        success: true,
        message: responseMessage,
      };
    } catch (error) {
      this.logger.error(
        `Error setting timezone ${command.timezone} for user ${command.userId}:`,
        error,
      );
      return {
        success: false,
        error: 'Failed to update timezone setting. Please try again later.',
      };
    }
  }
}
