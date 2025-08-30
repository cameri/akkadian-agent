import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsDate, IsEnum, IsNumber, IsString } from 'class-validator';
import { HydratedDocument } from 'mongoose';
import type { IFactPattern } from '../factoids.types';
import { FactPatternsCollectionName } from '../factoids.constants';

export type FactPatternDocument = HydratedDocument<FactPattern>;

export enum PatternType {
  LEARNING = 'learning',
  QUESTION = 'question',
}

@Schema({
  timestamps: true,
  collection: FactPatternsCollectionName,
})
export class FactPattern implements IFactPattern {
  @IsString()
  @Prop({ required: true, unique: true })
  pattern!: string;

  @IsEnum(PatternType)
  @Prop({ required: true, enum: PatternType })
  patternType!: 'learning' | 'question';

  @IsString()
  @Prop({ required: true })
  regex!: string;

  @IsNumber()
  @Prop({ required: true, default: 1 })
  priority!: number;

  @IsNumber()
  @Prop({ required: true, min: 0, max: 1, default: 1.0 })
  confidence!: number;

  @IsDate()
  @Prop()
  createdAt!: Date;

  @IsDate()
  @Prop()
  updatedAt!: Date;
}

export const FactPatternSchema = SchemaFactory.createForClass(FactPattern);

// Indexes for performance
FactPatternSchema.index({ patternType: 1, priority: -1 });
FactPatternSchema.index({ pattern: 1 }, { unique: true });
