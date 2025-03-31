import { index, modelOptions, prop } from '@typegoose/typegoose';
import { IsDate, IsOptional, IsString } from 'class-validator';
import { PatternType, ResponseType } from './simple-reply.constants';

@index({ pattern: 1, patternType: 1 }, { unique: true })
@modelOptions({
  schemaOptions: {
    timestamps: true, // Automatically adds `createdAt` and `updatedAt`
  },
  options: {
    customName: 'simple_replies',
  },
})
export class SimpleReply {
  @IsString()
  @prop({ required: true })
  pattern!: string;

  @IsString()
  @prop({ enum: Object.keys(PatternType), default: 'Exact' })
  patternType!: string;

  @IsString()
  @prop({ required: true })
  response!: string;

  @IsString()
  @prop({ enum: Object.keys(ResponseType), default: 'Text' })
  responseType!: string;

  @IsOptional()
  @IsString()
  @prop()
  mimeType?: string;

  @IsOptional()
  @IsString()
  @prop()
  fileName?: string;

  @IsOptional()
  @IsString()
  @prop()
  caption?: string;

  @IsOptional()
  @IsString()
  @prop()
  parseMode?: string;

  @IsOptional()
  @IsString()
  @prop()
  userId?: string;

  @IsOptional()
  @IsString()
  @prop()
  username?: string;

  @IsDate()
  @prop()
  createdAt!: Date;

  @IsDate()
  @prop()
  updatedAt!: Date;

  @IsOptional()
  @IsString()
  @prop()
  deletedAt?: Date;
}
