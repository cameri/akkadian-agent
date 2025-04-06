import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { CustomTransportStrategy, Server } from '@nestjs/microservices';
import { isAxiosError } from 'axios';
import {
  BehaviorSubject,
  catchError,
  EMPTY,
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
  withLatestFrom,
} from 'rxjs';
import { IPausableTimer } from '../../scheduling/pausable-timer.types';
import { TelegramResponse } from './ext/telegram-response';
import { TelegramUpdate } from './ext/telegram-update';
import {
  PAUSABLE_TIMER,
  TELEGRAM_USER_WHITELIST,
  TelegramServerTransport,
} from './telegram.constants';
import {
  GetUpdatesRequest,
  GetUpdatesResponse,
  ITelegramUpdate,
  IUser,
} from './telegram.types';

@Injectable()
export class TelegramServer extends Server implements CustomTransportStrategy {
  readonly transportId = TelegramServerTransport;

  private pollingSubscription: Subscription | undefined;

  private lastUpdateId$: BehaviorSubject<number | undefined>;
  private updateSubject: Subject<TelegramUpdate>;
  private handlerSubscriptions: Map<string, Subscription>;

  constructor(
    private readonly httpService: HttpService,
    @Inject(PAUSABLE_TIMER)
    private readonly pausableTimer: IPausableTimer,
    @Inject(TELEGRAM_USER_WHITELIST)
    private readonly userWhitelist: Set<number>,
  ) {
    super();

    this.lastUpdateId$ = new BehaviorSubject<number | undefined>(undefined);
    this.updateSubject = new Subject<TelegramUpdate>();
    this.handlerSubscriptions = new Map<string, Subscription>();
  }

  setupPolling() {
    this.pollingSubscription = this.pausableTimer.ticks$
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
  }

  bindHandlers() {
    for (const [pattern, handler] of this.messageHandlers) {
      const predicate = pattern as unknown as (
        update: TelegramUpdate,
      ) => boolean;

      const subscription = this.updateSubject
        .pipe(
          // filter((update) =>
          //   this.isUserWhitelisted(update.effective_message?.from),
          // ),
          filter(predicate),
          switchMap((update) =>
            this.transformToObservable(
              handler(update.effective_message, update),
            ).pipe(
              filter(
                (result: TelegramResponse) =>
                  result instanceof TelegramResponse,
              ),
              tap((result) => {
                if (result) {
                  this.logger.log('responding: %o', result);
                }
              }),
              map((result: TelegramResponse) => ({ update, result })),
              switchMap(({ update, result }) => this.respond(result, update)),
              tap((response: unknown) => {
                this.logger.log('response from telegram: %o', response);
              }),
              catchError((error: unknown) => {
                if (isAxiosError(error)) {
                  this.logger.error(
                    'error from telegram: %s: request: %o, response: %o',
                    error.message,
                    error.config?.data,
                    error.response?.data,
                  );
                }

                return EMPTY;
              }),
            ),
          ),
        )
        .subscribe();

      this.handlerSubscriptions.set(pattern, subscription);
    }
  }

  listen(callback: () => void) {
    this.bindHandlers();
    this.setupPolling();
    this.pausableTimer.start();

    callback();
  }

  respond(
    response: TelegramResponse,
    _update: ITelegramUpdate,
  ): Observable<unknown> {
    this.logger.log('responding to telegram: %o', response);
    if (response instanceof TelegramResponse) {
      return response.send(this.httpService);
    } else {
      this.logger.error(
        'message not sent: got unknown response type: %o',
        response,
      );
    }

    return EMPTY;
  }

  poll(lastUpdateId?: number): Observable<TelegramUpdate> {
    return this.httpService
      .get<GetUpdatesResponse, GetUpdatesRequest>('/getUpdates', {
        params: {
          // limit: 1,
          offset: lastUpdateId,
        },
      })
      .pipe(
        catchError((error) => {
          if (isAxiosError(error)) {
            this.logger.error(
              'poll failed: %s: %o',
              error.message,
              error.response?.data,
            );
          }

          return of({
            data: { result: [] } as GetUpdatesResponse,
          });
        }),
        mergeMap((response) => from(response.data.result)),
        map((update) => new TelegramUpdate(update)),
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

  private isUserWhitelisted(user: IUser | undefined): boolean {
    const result =
      this.userWhitelist.size > 0 && !!user && this.userWhitelist.has(user.id);
    this.logger.log('isUserWhitelisted %s: %s', user?.id, result);
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
