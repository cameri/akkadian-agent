import { HttpService } from '@nestjs/axios';
import { map } from 'rxjs';
import { IMessage, ITelegramSendReaction } from '../telegram.types';
import { TelegramResponse } from './telegram-response';

export class ReactionResponse extends TelegramResponse {
  constructor(private readonly response: ITelegramSendReaction) {
    super();
  }

  send<TResponse = IMessage>(httpService: HttpService) {
    return httpService
      .post<TResponse>('/setMessageReaction', this.response)
      .pipe(map((response) => response.data));
  }
}
