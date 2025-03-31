import { IUpdate, Message } from '../telegram.types';

export class Update implements IUpdate {
  private _effective_message: Message | undefined;

  update_id: number;
  message?: Message | undefined;
  edited_message?: Message | undefined;
  channel_post?: Message | undefined;
  edited_channel_post?: Message | undefined;

  constructor(update: IUpdate) {
    Object.assign(this, update);
  }

  get effective_message(): Message | undefined {
    if (this._effective_message) {
      return this._effective_message;
    }

    let message: Message | undefined;

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
