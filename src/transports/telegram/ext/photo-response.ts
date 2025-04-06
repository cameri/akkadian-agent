import { HttpService } from '@nestjs/axios';
import { map } from 'rxjs';
import { IMessage, ITelegramSendPhotoMessage } from '../telegram.types';
import { TelegramResponse } from './telegram-response';

export class PhotoResponse extends TelegramResponse {
  constructor(private readonly response: ITelegramSendPhotoMessage) {
    super();
  }

  send<TResponse = IMessage>(httpService: HttpService) {
    return httpService
      .post<TResponse>('/sendPhoto', this.response)
      .pipe(map((response) => response.data));
  }
}
