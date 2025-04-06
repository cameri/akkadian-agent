import { HttpService } from '@nestjs/axios';
import { map } from 'rxjs';
import { IMessage, ITelegramSendDocumentMessage } from '../telegram.types';
import { TelegramResponse } from './telegram-response';

export class DocumentResponse extends TelegramResponse {
  constructor(private readonly response: ITelegramSendDocumentMessage) {
    super();
  }

  send<TResponse = IMessage>(httpService: HttpService) {
    return httpService
      .post<TResponse>('/sendDocument', this.response)
      .pipe(map((response) => response.data));
  }
}
