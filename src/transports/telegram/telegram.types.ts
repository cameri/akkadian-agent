import { CustomTransportStrategy } from '@nestjs/microservices';

export type LanguageCode = string;

export interface IUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: LanguageCode;
  is_premium?: true;
  can_join_groups?: true;
  can_read_all_group_messages?: true;
  supports_inline_queries?: true;
}

export type ChatType = 'private' | 'group' | 'supergroup' | 'channel';

export interface IChat {
  id: number;
  title?: string;
  type: ChatType;
  username?: string;
  first_name?: string;
  last_name?: string;
  is_forum?: true;
}

export interface IChatPhoto {
  small_file_id: string;
  small_file_unique_id: string;
  big_file_id: string;
  big_file_unique_id: string;
}

export interface TextQuote {
  text: string;
  entities?: MessageEntity[];
  position: number;
  is_manual?: true;
}

export interface Story {
  chat: IChat;
  id: number;
}

export type MessageEntityType =
  | 'mention'
  | 'hashtag'
  | 'cashtag'
  | 'bot_command'
  | 'url'
  | 'email'
  | 'phone_number'
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikethrough'
  | 'spoiler'
  | 'blockquote'
  | 'expandable_blockquote'
  | 'code'
  | 'pre'
  | 'text_link'
  | 'text_mention'
  | 'custom_emoji';

export interface MessageEntity {
  type: string;
  offset: number;
  length: number;
  url?: string;
  user?: IUser;
  language?: string;
  custom_emoji_id?: string;
}

export interface Audio {
  file_id: string;
  file_unique_id: string;
  duration: number;
  performer?: string;
  title?: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
  thumbnail?: PhotoSize;
}

export interface Document {
  file_id: string;
  file_unique_id: string;
  thumbnail?: PhotoSize;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
}

export interface PhotoSize {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  file_size?: number;
}

export type StickerType = 'regular' | 'mask' | 'custom_emoji';

export interface Sticker {
  file_id: string;
  file_unique_id: string;
  type: StickerType;
  width: number;
  height: number;
  is_animated: boolean;
  is_video: boolean;
  thumbnail?: PhotoSize;
  emoji?: string;
  set_name?: string;
  file_size?: number;
}

export interface Video {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  thumbnail?: PhotoSize;
  cover?: PhotoSize[];
  start_timestamp: number;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
}

export interface VideoNote {
  file_id: string;
  file_unique_id: string;
  length: number;
  duration: number;
  thumbnail?: PhotoSize;
  file_size?: number;
}

export interface Voice {
  file_id: string;
  file_unique_id: string;
  duration: number;
  mime_type?: string;
  file_size?: number;
}

export interface PollOption {
  text: string;
  text_entities?: MessageEntity[];
  voter_count: number;
}

export type PollType = 'regular' | 'quiz';

export interface Poll {
  id: string;
  question: string;
  question_entities?: MessageEntity[];
  options: PollOption[];
  total_voter_count: number;
  is_closed: boolean;
  is_anonymous: boolean;
  type: PollType;
  allows_multiple_answers?: boolean;
  correct_option_id?: number;
  explanation?: string;
  explanation_entities?: MessageEntity[];
  open_period?: number;
  close_date?: number;
}

export interface InlineKeyboardButton {
  text: string;
  url?: string;
  callback_data?: string;
}

export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

export interface IMessage {
  message_id: number;
  message_thread_id?: number;
  from?: IUser;
  sender_chat?: IChat;
  date: number;
  chat: IChat;
  is_topic_message?: true;
  is_automatic_forward?: true;
  reply_to_message?: IMessage;
  quote?: TextQuote;
  reply_to_story?: Story;
  via_bot?: IUser;
  edit_date?: number;
  media_group_id?: string;
  author_signature?: string;
  text?: string;
  entities?: MessageEntity[];
  animation?: Animation;
  audio?: Audio;
  document?: Document;
  photo?: IChatPhoto;
  sticker?: Sticker;
  story?: Story;
  video?: Video;
  video_note?: VideoNote;
  caption?: string;
  caption_entities?: MessageEntity[];
  poll?: Poll;
  location?: Location;
  new_chat_members?: IUser[];
  left_chat_member?: IUser;
  new_chat_title: string;
  new_chat_photo?: PhotoSize[];
  delete_chat_photo?: true;
  group_chat_photo?: true;
  supergroup_chat_created?: true;
  channel_chat_created?: true;
  migrate_to_chat_id?: number;
  migrate_from_chat_id?: number;
  reply_markup: InlineKeyboardMarkup;
}

export interface InlineQuery {
  id: string;
  from: IUser;
  query: string;
  offset: string;
  chat_type: 'sender' | ChatType;
}

export interface CallbackQuery {
  id: string;
  from: IUser;
  inline_message_id?: string;
  chat_instance: string;
  data?: string;
}

export interface ChosenInlineResult {
  result_id: string;
  from: IUser;
  inline_message_id?: string;
  query: string;
}

export interface ITelegramUpdate {
  update_id: number;
  message?: IMessage;
  edited_message?: IMessage;
  channel_post?: IMessage;
  edited_channel_post?: IMessage;
}

export type AllowedUpdate = keyof ITelegramUpdate;

export interface GetUpdatesRequest {
  offset?: number;
  limit?: number;
  timeout?: number;
  allowed_updates?: AllowedUpdate[];
}

export interface GetUpdatesResponseParameters {
  /**
   * Number of seconds to retry after
   */
  retry_after: number;
}

export interface TooManyRequestsResponse {
  ok: false;
  error_code: 429;
  description?: string;
  parameters: GetUpdatesResponseParameters;
}

export interface GetUpdatesOkResponse {
  ok?: true;
  result: ITelegramUpdate[];
}

export type GetUpdatesResponse = GetUpdatesOkResponse;

export interface LinkPreviewOptions {
  is_disabled?: boolean;
  url?: string;
  prefer_small_media?: boolean;
  prefer_large_media?: boolean;
  show_above_text?: boolean;
}

export interface ReplyParameters {
  message_id: number;
  chat_id?: string | number;
  allow_sending_without_reply?: boolean;
  quote?: string;
}

export interface ITelegramServer extends CustomTransportStrategy {
  pause(): void;
  resume(): void;
}

export interface ITelegramSendMessage {
  chat_id: string | number;
  message_thread_id?: number;
  reply_parameters?: ReplyParameters;
}

export interface ITelegramSendTextMessage extends ITelegramSendMessage {
  text: string;
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  entities?: MessageEntity[];
  link_preview_options?: LinkPreviewOptions;
  protect_content?: boolean;
  disable_notification?: boolean;
}

export interface ITelegramSendStickerMessage extends ITelegramSendMessage {
  sticker: string;
  emoji?: string;
  disable_notification?: boolean;
}

export interface ITelegramSendPhotoMessage extends ITelegramSendMessage {
  photo: string;
  caption?: string;
  caption_entities?: MessageEntity[];
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  disable_notification?: boolean;
}

export interface ITelegramSendDocumentMessage extends ITelegramSendMessage {
  document: string;
  thumbnail?: string;
  caption?: string;
  caption_entities?: MessageEntity[];
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  disable_notification?: boolean;
}

export interface ITelegramSendVoiceMessage extends ITelegramSendMessage {
  voice: string;
  duration?: number;
  caption?: string;
  caption_entities?: MessageEntity[];
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  disable_notification?: boolean;
}

export interface ITelegramSendVideoMessage extends ITelegramSendMessage {
  video: string;
  duration?: number;
  width?: number;
  height?: number;
  cover?: string;
  caption?: string;
  caption_entities?: MessageEntity[];
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  disable_notification?: boolean;
}

export interface ITelegramSendAudioMessage extends ITelegramSendMessage {
  audio: string;
  duration?: number;
  performer?: string;
  title?: string;
  caption?: string;
  caption_entities?: MessageEntity[];
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  disable_notification?: boolean;
}

export interface ITelegramSendChatActionMessage extends ITelegramSendMessage {
  action:
    | 'typing'
    | 'upload_photo'
    | 'record_video'
    | 'upload_video'
    | 'record_voice'
    | 'upload_voice'
    | 'upload_document'
    | 'choose_sticker'
    | 'find_location'
    | 'record_video_note'
    | 'upload_video_note';
}

export type ReactionType = ReactionTypeEmoji;

export interface ReactionTypeEmoji {
  type: 'emoji';
  emoji:
    | '👍'
    | '👎'
    | '❤'
    | '🔥'
    | '🥰'
    | '👏'
    | '😁'
    | '🤔'
    | '🤯'
    | '😱'
    | '🤬'
    | '😢'
    | '🎉'
    | '🤩'
    | '🤮'
    | '💩'
    | '🙏'
    | '👌'
    | '🕊'
    | '🤡'
    | '🥱'
    | '🥴'
    | '😍'
    | '🐳'
    | '❤‍🔥'
    | '🌚'
    | '🌭'
    | '💯'
    | '🤣'
    | '⚡'
    | '🍌'
    | '🏆'
    | '💔'
    | '🤨'
    | '😐'
    | '🍓'
    | '🍾'
    | '💋'
    | '🖕'
    | '😈'
    | '😴'
    | '😭'
    | '🤓'
    | '👻'
    | '👨‍💻'
    | '👀'
    | '🎃'
    | '🙈'
    | '😇'
    | '😨'
    | '🤝'
    | '✍'
    | '🤗'
    | '🫡'
    | '🎅'
    | '🎄'
    | '☃'
    | '💅'
    | '🤪'
    | '🗿'
    | '🆒'
    | '💘'
    | '🙉'
    | '🦄'
    | '😘'
    | '💊'
    | '🙊'
    | '😎'
    | '👾'
    | '🤷‍♂'
    | '🤷'
    | '🤷‍♀'
    | '😡';
}

export interface ITelegramSendReaction {
  chat_id: string | number;
  message_id: number;
  reaction: ReactionType[];
  is_big?: true;
}
