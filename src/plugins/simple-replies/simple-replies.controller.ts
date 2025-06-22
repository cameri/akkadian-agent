import { Controller, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Ctx, MessagePattern, Payload } from '@nestjs/microservices';
import {
  allPass,
  always,
  applySpec,
  cond,
  construct,
  equals,
  ifElse,
  is,
  last,
  match,
  path,
  pipe,
  T,
  test,
  toLower,
} from 'ramda';
import { AudioResponse } from '../../transports/telegram/ext/audio-response';
import { DocumentResponse } from '../../transports/telegram/ext/document-response';
import { PhotoResponse } from '../../transports/telegram/ext/photo-response';
import { ReactionResponse } from '../../transports/telegram/ext/reaction-response';
import { StickerResponse } from '../../transports/telegram/ext/sticker-response';
import { TelegramUpdate } from '../../transports/telegram/ext/telegram-update';
import { TextResponse } from '../../transports/telegram/ext/text-response';
import { VideoResponse } from '../../transports/telegram/ext/video-response';
import { VoiceResponse } from '../../transports/telegram/ext/voice-response';
import { TelegramServerTransport } from '../../transports/telegram/telegram.constants';
import { IMessage } from '../../transports/telegram/telegram.types';
import { AddReplyCommand } from './commands/add-reply.command';
import { RemoveReplyCommand } from './commands/remove-reply.command';
import { GetReplyQuery } from './queries/get-reply.query';
import {
  addReplyCommandRegExp,
  removeReplyCommandRegExp,
} from './simple-replies.constants';
import {
  AddReplyCommandArgs,
  GetReplyQueryArgs,
  RemoveReplyCommandArgs,
} from './simple-replies.types';
import { PatternType, ResponseType } from './simple-reply.constants';

const AddReplyCommandPattern = allPass([
  pipe(path(['effective_message', 'text']), test(addReplyCommandRegExp)),
  pipe(path(['effective_message', 'reply_to_message']), is(Object)),
]);

const RemoveReplyCommandPattern = pipe(
  path(['effective_message', 'text']),
  test(removeReplyCommandRegExp),
);

const removeAccents = (input: string) =>
  input.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

@Controller()
export class SimpleRepliesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly logger: Logger,
  ) {}

  @MessagePattern(AddReplyCommandPattern, TelegramServerTransport)
  async handleAddReplyMessage(
    @Payload() message: IMessage,
    @Ctx() update: TelegramUpdate,
  ) {
    this.logger.log('handleAddReplyMessage: %o', update);

    const toJSON = (obj: unknown) => JSON.stringify(obj);

    const args: AddReplyCommandArgs = applySpec<AddReplyCommandArgs>({
      pattern: pipe(
        path(['text']),
        match(addReplyCommandRegExp),
        path(['groups', 'pattern']),
        toLower,
        removeAccents,
      ),
      patternType: always(PatternType.Exact),
      response: pipe(
        path(['reply_to_message']),
        cond([
          [
            pipe(path(['photo']), is(Object)),
            pipe(path(['photo']), last, path(['file_id'])),
          ],
          [pipe(path(['video']), is(Object)), pipe(path(['video', 'file_id']))],
          [
            pipe(path(['sticker']), is(Object)),
            pipe(path(['sticker', 'file_id'])),
          ],
          [pipe(path(['voice']), is(Object)), pipe(path(['voice', 'file_id']))],
          [pipe(path(['audio']), is(Object)), pipe(path(['audio', 'file_id']))],
          [
            pipe(path(['document']), is(Object)),
            pipe(path(['document', 'file_id'])),
          ],
          [
            pipe(path(['contact']), is(Object)),
            pipe(path(['contact']), toJSON),
          ],
          [
            pipe(path(['location']), is(Object)),
            pipe(path(['location']), toJSON),
          ],
          [T, path(['text'])],
        ]),
      ),
      responseType: pipe(
        path(['reply_to_message']),
        cond([
          [pipe(path(['photo']), is(Object)), always(ResponseType.Photo)],
          [pipe(path(['video']), is(Object)), always(ResponseType.Video)],
          [pipe(path(['sticker']), is(Object)), always(ResponseType.Sticker)],
          [pipe(path(['voice']), is(Object)), always(ResponseType.Voice)],
          [pipe(path(['audio']), is(Object)), always(ResponseType.Audio)],
          [
            pipe(path(['document']), is(Object)),
            ifElse(
              pipe(path(['document', 'mime_type']), equals('video/mp4')),
              always(ResponseType.GIF),
              always(ResponseType.File),
            ),
          ],
          [pipe(path(['contact']), is(Object)), always(ResponseType.Contact)],
          [pipe(path(['location']), is(Object)), always(ResponseType.Location)],
          [T, always(ResponseType.Text)],
        ]),
      ),
      userId: path(['from', 'id']),
      username: path(['from', 'username']),
    })(message);

    const command = new AddReplyCommand(args);

    const { error, result } = await this.commandBus.execute(command);
    if (error) {
      return new TextResponse({
        chat_id: message.chat.id,
        reply_parameters: {
          message_id: message.message_id,
        },
        text: `😥 I was not able to add a reply: ${error}`,
      });
    } else if (result) {
      return new ReactionResponse({
        chat_id: message.chat.id,
        message_id: message.message_id,
        reaction: [
          {
            emoji: '🫡',
            type: 'emoji',
          },
        ],
      });
    }
  }

  @MessagePattern(RemoveReplyCommandPattern, TelegramServerTransport)
  handleRemoveReplyMessage(@Payload() update: TelegramUpdate) {
    const constructCommand = pipe<
      [TelegramUpdate],
      RemoveReplyCommandArgs,
      RemoveReplyCommand
    >(
      applySpec<RemoveReplyCommandArgs>({
        pattern: pipe(
          path(['text']),
          match(removeReplyCommandRegExp),
          path(['groups', 'pattern']),
        ),
      }),
      construct(RemoveReplyCommand),
    );

    const command = constructCommand(update);

    return this.commandBus.execute(command);
  }

  @MessagePattern(
    pipe(path(['text']), test(/^[^/].+/)),
    TelegramServerTransport,
  )
  async handleTextMessage(
    @Payload() message: IMessage,
    @Ctx() _update: TelegramUpdate,
  ) {
    this.logger.log(
      'received from %s: %s',
      message.from?.first_name,
      message.text,
    );

    const args = applySpec<GetReplyQueryArgs>({
      pattern: pipe(path(['text']), toLower, removeAccents),
    })(message);

    const query = new GetReplyQuery(args);

    const { result, error } = await this.queryBus.execute(query);

    if (error) {
      this.logger.error('Error getting reply: %o', error);
      return;
    } else if (!result) {
      this.logger.verbose('No reply found for pattern: %s', message.text);
      return;
    }

    switch (result.responseType) {
      case ResponseType.Text:
        return new TextResponse({
          chat_id: message.chat.id,
          reply_parameters: {
            message_id: message.message_id,
          },
          text: result.response,
        });
      case ResponseType.Sticker:
        return new StickerResponse({
          chat_id: message.chat.id,
          reply_parameters: {
            message_id: message.message_id,
          },
          sticker: result.response,
        });
      case ResponseType.Photo:
        return new PhotoResponse({
          chat_id: message.chat.id,
          reply_parameters: {
            message_id: message.message_id,
          },
          photo: result.response,
          caption: result.caption,
        });
      case ResponseType.GIF:
      case ResponseType.File:
        return new DocumentResponse({
          chat_id: message.chat.id,
          reply_parameters: {
            message_id: message.message_id,
          },
          document: result.response,
          caption: result.caption,
        });
      case ResponseType.Voice:
        return new VoiceResponse({
          chat_id: message.chat.id,
          reply_parameters: {
            message_id: message.message_id,
          },
          voice: result.response,
        });
      case ResponseType.Audio:
        return new AudioResponse({
          chat_id: message.chat.id,
          reply_parameters: {
            message_id: message.message_id,
          },
          audio: result.response,
          caption: result.caption,
        });
      case ResponseType.Video:
        return new VideoResponse({
          chat_id: message.chat.id,
          reply_parameters: {
            message_id: message.message_id,
          },
          video: result.response,
          caption: result.caption,
        });
      default:
        this.logger.error('Unsupported response type: %o', result.responseType);
    }
  }
}
