import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FactPattern } from '../schemas/fact-pattern.schema';
import type { IFactPattern, IFactPatternsRepository } from '../factoids.types';

@Injectable()
export class FactPatternsRepository implements IFactPatternsRepository {
  constructor(
    @InjectModel(FactPattern.name)
    private readonly factPatternModel: Model<FactPattern>,
  ) {}

  async findAll(): Promise<IFactPattern[]> {
    const results = await this.factPatternModel
      .find()
      .sort({ priority: -1, createdAt: 1 });

    return results.map((doc) => doc.toObject());
  }

  async findByType(
    patternType: 'learning' | 'question',
  ): Promise<IFactPattern[]> {
    const results = await this.factPatternModel
      .find({ patternType })
      .sort({ priority: -1, createdAt: 1 });

    return results.map((doc) => doc.toObject());
  }

  async create(pattern: IFactPattern): Promise<IFactPattern> {
    const createdPattern = new this.factPatternModel(pattern);
    const result = await createdPattern.save();
    return result.toObject();
  }

  async update(
    id: string,
    pattern: Partial<IFactPattern>,
  ): Promise<IFactPattern | null> {
    const result = await this.factPatternModel.findByIdAndUpdate(
      id,
      { $set: pattern },
      { new: true },
    );

    return result ? result.toObject() : null;
  }
}
