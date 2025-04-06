import { IMessage, ITelegramUpdate } from '../telegram.types';

export class TelegramUpdate implements ITelegramUpdate {
  private _effective_message: IMessage | undefined;

  update_id: number;
  message?: IMessage | undefined;
  edited_message?: IMessage | undefined;
  channel_post?: IMessage | undefined;
  edited_channel_post?: IMessage | undefined;

  constructor(update: ITelegramUpdate) {
    Object.assign(this, update);
  }

  get effective_message(): IMessage | undefined {
    if (this._effective_message) {
      return this._effective_message;
    }

    let message: IMessage | undefined;

    if (this.message) {
      message = this.message;
    } else if (this.edited_message) {
      message = this.edited_message;
    } else if (this.channel_post) {
      message = this.channel_post;
    } else if (this.edited_channel_post) {
      message = this.edited_channel_post;
    }

    this._effective_message = message;

    return message;
  }
}
