import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  IsDate,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { HydratedDocument } from 'mongoose';
import type { IChatKnowledge } from '../factoids.types';
import { ChatKnowledgeCollectionName } from '../factoids.constants';

export type ChatKnowledgeDocument = HydratedDocument<ChatKnowledge>;

@Schema({
  timestamps: true,
  collection: ChatKnowledgeCollectionName,
})
export class ChatKnowledge implements IChatKnowledge {
  @IsString()
  @Prop({ required: true, unique: true })
  chatId!: string;

  @IsNumber()
  @Prop({ required: true, default: 0 })
  factCount!: number;

  @IsOptional()
  @IsDate()
  @Prop()
  lastActivity?: Date;

  @IsOptional()
  @IsObject()
  @Prop({
    type: {
      learningEnabled: { type: Boolean, default: true },
      maxFacts: { type: Number, default: 10000 },
      minConfidence: { type: Number, default: 0.6 },
    },
    default: {
      learningEnabled: true,
      maxFacts: 10000,
      minConfidence: 0.6,
    },
  })
  settings?: {
    learningEnabled: boolean;
    maxFacts: number;
    minConfidence: number;
  };

  @IsDate()
  @Prop()
  createdAt!: Date;

  @IsDate()
  @Prop()
  updatedAt!: Date;
}

export const ChatKnowledgeSchema = SchemaFactory.createForClass(ChatKnowledge);

// Indexes
ChatKnowledgeSchema.index({ chatId: 1 }, { unique: true });
ChatKnowledgeSchema.index({ lastActivity: -1 });
ChatKnowledgeSchema.index({ factCount: -1 });
