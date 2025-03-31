import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { CustomTransportStrategy, Server } from '@nestjs/microservices';
import {
  BehaviorSubject,
  catchError,
  filter,
  from,
  map,
  mergeMap,
  Observable,
  of,
  Subject,
  Subscription,
  switchMap,
  tap,
  timer,
  withLatestFrom,
} from 'rxjs';
import { Update } from './ext/update';
import {
  TELEGRAM_USER_WHITELIST,
  TelegramServerTransport,
} from './telegram.constants';
import {
  GetUpdatesRequest,
  GetUpdatesResponse,
  IUpdate,
  SendMessageRequest,
  SendMessageResponse,
  User,
} from './telegram.types';

@Injectable()
export class TelegramServer extends Server implements CustomTransportStrategy {
  readonly transportId = TelegramServerTransport;

  private pollingSubscription: Subscription | undefined;

  private lastUpdateId$: BehaviorSubject<number | undefined>;
  private updateSubject: Subject<IUpdate>;
  private handlerSubscriptions: Map<string, Subscription>;

  constructor(
    private readonly httpService: HttpService,
    @Inject(TELEGRAM_USER_WHITELIST)
    private readonly userWhitelist: Set<number>,
  ) {
    super();
    this.lastUpdateId$ = new BehaviorSubject<number | undefined>(undefined);
    this.updateSubject = new Subject<IUpdate>();
    this.handlerSubscriptions = new Map<string, Subscription>();
  }

  listen(callback: () => void) {
    this.pollingSubscription = timer(0, 2000)
      .pipe(
        withLatestFrom(this.lastUpdateId$),
        switchMap(([_, lastUpdateId]) => this.poll(lastUpdateId)),
        tap((update) => this.lastUpdateId$.next(update.update_id + 1)),
      )
      .subscribe({
        next: (update) => this.updateSubject.next(update),
        error: (err) =>
          void this.logger.error('polling error, not resuming.', err),
        complete: () => void this.logger.log('polling ended'),
      });

    for (const [pattern, handler] of this.messageHandlers) {
      const predicate = pattern as unknown as (update: Update) => boolean;

      const subscription = this.updateSubject
        .pipe(
          filter(predicate),
          filter((update) =>
            this.isUserWhitelisted(update.effective_message?.from),
          ),
          switchMap((update) =>
            this.transformToObservable(handler(update)).pipe(
              map((result: unknown) => ({ update, result })),
            ),
          ),
          filter(({ result }: any) => 'reply_text' in result),
          switchMap(
            ({
              update,
              result,
            }: {
              update: IUpdate;
              result: { reply_text: string };
            }) => this.respond(result, update),
          ),
        )
        .subscribe();

      this.handlerSubscriptions.set(pattern, subscription);
    }

    callback();
  }

  respond(result: { reply_text: string }, update: IUpdate) {
    return this.httpService.post<SendMessageResponse, SendMessageRequest>(
      '/sendMessage',
      {
        chat_id: update.message!.chat.id,
        text: result.reply_text,
        reply_parameters: {
          message_id: update.message!.message_id,
        },
      },
    );
  }

  poll(lastUpdateId?: number): Observable<Update> {
    return this.httpService
      .get<GetUpdatesResponse, GetUpdatesRequest>('/getUpdates', {
        params: {
          // limit: 1,
          offset: lastUpdateId,
        },
        timeout: 5000,
      })
      .pipe(
        catchError((error) => {
          this.logger.error('got polling error', error);

          return of({
            data: { result: [] } as GetUpdatesResponse,
          });
        }),
        mergeMap((response) => from(response.data.result)),
        map((update) => new Update(update)),
      );
  }

  close() {
    if (this.pollingSubscription && !this.pollingSubscription.closed) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = undefined;
    }

    this.handlerSubscriptions.forEach((subscription) =>
      subscription.unsubscribe(),
    );

    this.lastUpdateId$.next(undefined);
  }

  private isUserWhitelisted(user: User | undefined): boolean {
    const result =
      this.userWhitelist.size > 0 && !!user && this.userWhitelist.has(user.id);

    return result;
  }

  on<
    EventKey extends string = string,
    EventCallback extends Function = (...args: any[]) => void,
  >(_event: EventKey, _callback: EventCallback) {
    throw new Error('Method not implemented.');
  }

  unwrap<T>(): T {
    throw new Error('Method not implemented.');
  }
}
