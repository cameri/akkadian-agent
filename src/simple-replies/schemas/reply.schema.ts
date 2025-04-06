import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsDate, IsOptional, IsString } from 'class-validator';
import { HydratedDocument } from 'mongoose';
import { IReply } from '../simple-replies.types';
import {
  PatternType,
  ResponseType,
  SimpleRepliesCollectionName,
} from '../simple-reply.constants';

export type ReplyDocument = HydratedDocument<Reply>;

@Schema({
  timestamps: true, // Automatically adds `createdAt` and `updatedAt`
  collection: SimpleRepliesCollectionName,
})
export class Reply implements IReply {
  @IsString()
  @Prop({ required: true, unique: true })
  pattern!: string;

  @IsString()
  @Prop({ enum: Object.keys(PatternType), default: 'Exact' })
  patternType!: PatternType;

  @IsString()
  @Prop({ required: true })
  response!: string;

  @IsString()
  @Prop({ enum: Object.keys(ResponseType), default: 'Text' })
  responseType!: ResponseType;

  @IsOptional()
  @IsString()
  @Prop()
  mimeType?: string;

  @IsOptional()
  @IsString()
  @Prop()
  fileName?: string;

  @IsOptional()
  @IsString()
  @Prop()
  caption?: string;

  @IsOptional()
  @IsString()
  @Prop()
  parseMode?: string;

  @IsOptional()
  @IsString()
  @Prop()
  userId?: string;

  @IsOptional()
  @IsString()
  @Prop()
  username?: string;

  @IsDate()
  @Prop()
  createdAt!: Date;

  @IsDate()
  @Prop()
  updatedAt!: Date;

  @IsOptional()
  @IsString()
  @Prop()
  deletedAt?: Date;
}

export const ReplySchema = SchemaFactory.createForClass(Reply);

ReplySchema.index({ pattern: 1, patternType: 1 }, { unique: true });
