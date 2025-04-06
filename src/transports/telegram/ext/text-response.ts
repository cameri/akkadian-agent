import { HttpService } from '@nestjs/axios';
import { map } from 'rxjs';
import { IMessage, ITelegramSendTextMessage } from '../telegram.types';
import { TelegramResponse } from './telegram-response';

export class TextResponse extends TelegramResponse {
  constructor(private readonly response: ITelegramSendTextMessage) {
    super();
  }

  send<TResponse = IMessage>(httpService: HttpService) {
    return httpService
      .post<TResponse>('/sendMessage', this.response)
      .pipe(map((response) => response.data));
  }
}
