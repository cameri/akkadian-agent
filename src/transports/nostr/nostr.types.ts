import {
  NostrEventKinds,
  NostrEventTags,
  NostrMessageType,
} from './nostr.constants';

export type SubscriptionId = string;

type Enumerate<
  N extends number,
  Acc extends number[] = [],
> = Acc['length'] extends N
  ? Acc[number]
  : Enumerate<N, [...Acc, Acc['length']]>;

export type Range<F extends number, T extends number> = Exclude<
  Enumerate<T>,
  Enumerate<F>
>;

type ExtraTagValues = {
  [index in Range<2, 100>]?: string;
};

export interface TagBase extends ExtraTagValues {
  0: TagName;
  1: string;
}

export type EventId = string;
export type Pubkey = string;
export type TagName = NostrEventTags;
export type Signature = string;
export type Tag = TagBase & string[];

export interface BaseEvent {
  id: EventId;
  pubkey: Pubkey;
  created_at: number;
  kind: NostrEventKinds;
  tags: Tag[];
  sig: string;
  content: string;
}

export interface OutboundEventMessage {
  0: NostrMessageType.EVENT;
  1: Event;
}

export interface InboundEventMessage {
  0: NostrMessageType.EVENT;
  1: SubscriptionId;
  2: Event;
}

export interface UnsubscribeMessage {
  0: NostrMessageType.CLOSE;
  1: SubscriptionId;
}

export interface NoticeMessage {
  0: NostrMessageType.NOTICE;
  1: string;
}

export interface CommandResult {
  0: NostrMessageType.OK;
  1: EventId;
  2: boolean;
  3: string;
}

export interface EndOfStoredEventsNotice {
  0: NostrMessageType.EOSE;
  1: SubscriptionId;
}
