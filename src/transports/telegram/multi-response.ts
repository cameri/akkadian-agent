import { merge } from 'rxjs';
import { TelegramResponse } from './ext/telegram-response';

export class MultiTelegramResponse extends TelegramResponse {
  constructor(private readonly responses: TelegramResponse[]) {
    super();
  }

  send<TResponse = any>(httpService: any) {
    return merge(
      ...this.responses.map((response) =>
        response.send<TResponse>(httpService),
      ),
    );
  }
}
