import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsDate, IsOptional, IsString } from 'class-validator';
import { Document } from 'mongoose';
import {
  PatternType,
  ResponseType,
  SimpleRepliesCollectionName,
} from './simple-reply.constants';

@Schema({
  timestamps: true, // Automatically adds `createdAt` and `updatedAt`
  collection: SimpleRepliesCollectionName,
})
export class SimpleReply extends Document {
  @IsString()
  @Prop({ required: true, unique: true })
  pattern!: string;

  @IsString()
  @Prop({ enum: Object.keys(PatternType), default: 'Exact' })
  patternType!: string;

  @IsString()
  @Prop({ required: true })
  response!: string;

  @IsString()
  @Prop({ enum: Object.keys(ResponseType), default: 'Text' })
  responseType!: string;

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

export const SimpleReplySchema = SchemaFactory.createForClass(SimpleReply);

SimpleReplySchema.index({ pattern: 1, patternType: 1 }, { unique: true });
