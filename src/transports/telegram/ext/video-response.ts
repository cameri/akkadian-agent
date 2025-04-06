import { HttpService } from '@nestjs/axios';
import { map } from 'rxjs';
import { IMessage, ITelegramSendVideoMessage } from '../telegram.types';
import { TelegramResponse } from './telegram-response';

export class VideoResponse extends TelegramResponse {
  constructor(private readonly response: ITelegramSendVideoMessage) {
    super();
  }

  send<TResponse = IMessage>(httpService: HttpService) {
    return httpService
      .post<TResponse>('/sendVideo', this.response)
      .pipe(map((response) => response.data));
  }
}
