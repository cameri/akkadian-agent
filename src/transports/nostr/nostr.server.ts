import { Inject, Injectable } from '@nestjs/common';
import { CustomTransportStrategy, Server } from '@nestjs/microservices';
import { RawData, WebSocket } from 'ws';
import {
  NOSTR_RELAY_LIST,
  NOSTR_USER_WHITELIST,
  NostrMessageType,
} from './nostr.constants';
import { InboundEventMessage } from './nostr.types';

@Injectable()
export class NostrServer extends Server implements CustomTransportStrategy {
  private relayUrls: string[];
  private connections = new Map<string, WebSocket>();
  private subscriptions = new Map<string, (eventData: any) => void>();

  /**
   * @param relayList - A set of relay websocket URLs, e.g. Set(["wss://relay1.example", "wss://relay2.example"])
   */
  constructor(
    @Inject(NOSTR_RELAY_LIST)
    readonly relayList: Set<string>,
    @Inject(NOSTR_USER_WHITELIST)
    private readonly userWhitelist: Set<number>,
  ) {
    super();
    this.relayUrls = [...relayList.values()];
  }

  on<
    EventKey extends string = string,
    EventCallback extends Function = Function,
  >(_event: EventKey, _callback: EventCallback) {
    // This method can be expanded to store event handlers if needed.
    // For now, subscription callbacks are managed via the subscribe/unsubscribe methods.
    throw new Error('Method not implemented.');
  }

  unwrap<T>(): T {
    throw new Error('Method not implemented.');
  }

  /**
   * Opens websocket connections to all provided relay URLs.
   * Once all connections have initialized, the provided callback is invoked.
   */
  listen(callback: (...optionalParams: unknown[]) => any) {
    this.relayUrls.forEach((url) => {
      const ws = new WebSocket(url);
      ws.on('open', () => {
        this.logger.log(`Connected to relay: ${url}`);
      });
      ws.on('message', (data: RawData) => {
        try {
          const message = JSON.parse(
            // eslint-disable-next-line @typescript-eslint/no-base-to-string
            data.toString('utf8'),
          ) as InboundEventMessage;
          // Handle Nostr EVENT messages: ["EVENT", subscriptionId, eventData, ...]
          if (Array.isArray(message) && message[0] === NostrMessageType.EVENT) {
            const subscriptionId = message[1];
            const eventData = message[2];
            const handler = this.subscriptions.get(subscriptionId);
            if (handler) {
              handler(eventData);
            }
          }
        } catch (e) {
          this.logger.error('Error parsing message', e);
        }
      });
      ws.on('error', (err) => {
        this.logger.error(`Error on relay ${url}:`, err);
      });
      ws.on('close', () => {
        this.logger.warn(`Connection closed: ${url}`);
      });
      this.connections.set(url, ws);
    });
    // Once setup is complete, invoke the callback.
    callback();
  }

  /**
   * Closes all open websocket connections.
   */
  close() {
    this.connections.forEach((ws, url) => {
      ws.close();
      this.logger.log(`Closed connection to relay: ${url}`);
    });
    this.connections.clear();
  }

  /**
   * Sends a subscription (REQ) to all connected relays.
   * @param subscriptionId - A unique identifier for the subscription request.
   * @param filter - A filter (as defined in Nostr protocol) that describes which events to subscribe to.
   * @param callback - Callback function to be invoked when an event matching the subscription is received.
   */
  subscribe(
    subscriptionId: string,
    filter: object,
    callback: (eventData: any) => void,
  ) {
    this.subscriptions.set(subscriptionId, callback);
    const msg = JSON.stringify(['REQ', subscriptionId, filter]);
    this.connections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(msg);
      }
    });
    this.logger.log(`Sent subscription ${subscriptionId} request`);
  }

  /**
   * Sends an unsubscribe (CLOSE) message to all connected relays.
   * @param subscriptionId - The identifier used during subscribe.
   */
  unsubscribe(subscriptionId: string) {
    this.subscriptions.delete(subscriptionId);
    const msg = JSON.stringify(['CLOSE', subscriptionId]);
    this.connections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(msg);
      }
    });
    this.logger.log(`Sent unsubscribe for ${subscriptionId}`);
  }
}
