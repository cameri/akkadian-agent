import { PatternType, ResponseType } from './simple-reply.constants';

export type AddReplyCommandArgs = IReply;

export interface AddReplyCommandResult {
  error?: string;
  result?: boolean;
}

export interface RemoveReplyCommandArgs {
  pattern: string;
}

export interface RemoveReplyCommandResult {
  replyText: string;
}

export interface GetReplyQueryArgs {
  pattern: string;
}

export interface GetReplyQueryResult {
  error?: string;
  result?: IReply;
}

export interface IReplyRepository {
  create(reply: IReply): Promise<IReply | null>;
  delete(pattern: string): Promise<boolean>;
  findOneByPattern(pattern: string): Promise<IReply | undefined>;
}

export interface IReply {
  pattern: string;
  patternType: PatternType;
  response: string;
  responseType: ResponseType;
  mimeType?: string;
  fileName?: string;
  caption?: string;
  parseMode?: string;
  userId?: string;
  username?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}
