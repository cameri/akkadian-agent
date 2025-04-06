import { HttpService } from '@nestjs/axios';
import { Observable } from 'rxjs';

export abstract class TelegramResponse {
  abstract send<TResponse>(httpService: HttpService): Observable<TResponse>;
}
