import { HttpService } from '@nestjs/axios';
import { map } from 'rxjs';
import { IMessage, ITelegramSendStickerMessage } from '../telegram.types';
import { TelegramResponse } from './telegram-response';

export class StickerResponse extends TelegramResponse {
  constructor(private readonly response: ITelegramSendStickerMessage) {
    super();
  }

  send<TResponse = IMessage>(httpService: HttpService) {
    return httpService
      .post<TResponse>('/sendSticker', this.response)
      .pipe(map((response) => response.data));
  }
}
