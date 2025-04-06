import { HttpService } from '@nestjs/axios';
import { map } from 'rxjs';
import { IMessage, ITelegramSendVoiceMessage } from '../telegram.types';
import { TelegramResponse } from './telegram-response';

export class VoiceResponse extends TelegramResponse {
  constructor(private readonly response: ITelegramSendVoiceMessage) {
    super();
  }

  send<TResponse = IMessage>(httpService: HttpService) {
    return httpService
      .post<TResponse>('/sendVoice', this.response)
      .pipe(map((response) => response.data));
  }
}
