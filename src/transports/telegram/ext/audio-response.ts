import { HttpService } from '@nestjs/axios';
import { map } from 'rxjs';
import { IMessage, ITelegramSendAudioMessage } from '../telegram.types';
import { TelegramResponse } from './telegram-response';

export class AudioResponse extends TelegramResponse {
  constructor(private readonly response: ITelegramSendAudioMessage) {
    super();
  }

  send<TResponse = IMessage>(httpService: HttpService) {
    return httpService
      .post<TResponse>('/sendAudio', this.response)
      .pipe(map((response) => response.data));
  }
}
