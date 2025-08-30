import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsDate, IsNumber, IsOptional, IsString } from 'class-validator';
import { HydratedDocument } from 'mongoose';
import type { IFactoid } from '../factoids.types';
import { FactoidsCollectionName } from '../factoids.constants';

export type FactoidDocument = HydratedDocument<Factoid>;

@Schema({
  timestamps: true, // Automatically adds `createdAt` and `updatedAt`
  collection: FactoidsCollectionName,
})
export class Factoid implements IFactoid {
  @IsString()
  @Prop({ required: true, index: true })
  chatId!: string;

  @IsString()
  @Prop({ required: true, index: true })
  subject!: string;

  @IsString()
  @Prop({ required: true })
  predicate!: string;

  @IsNumber()
  @Prop({ required: true, min: 0, max: 1, default: 1.0 })
  confidence!: number;

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
  @IsDate()
  @Prop()
  deletedAt?: Date;
}

export const FactoidSchema = SchemaFactory.createForClass(Factoid);

// Create compound indexes for performance
FactoidSchema.index({ chatId: 1, subject: 1 }, { unique: true });
FactoidSchema.index({ chatId: 1, confidence: -1 });
FactoidSchema.index({ chatId: 1, createdAt: -1 });
FactoidSchema.index({ chatId: 1, deletedAt: 1 });

// Text index for full-text search
FactoidSchema.index(
  {
    subject: 'text',
    predicate: 'text',
  },
  {
    name: 'factoid_text_index',
  },
);
