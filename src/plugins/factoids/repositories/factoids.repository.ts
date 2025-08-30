import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { IFactoid, IFactoidsRepository } from '../factoids.types';
import { Factoid } from '../schemas/factoid.schema';

@Injectable()
export class FactoidsRepository implements IFactoidsRepository {
  constructor(
    @InjectModel(Factoid.name)
    private readonly factoidModel: Model<Factoid>,
  ) {}

  async create(factoid: IFactoid): Promise<IFactoid> {
    const { chatId, subject, ...update } = factoid;
    const filter = { chatId, subject };
    const options = {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    };

    const result = await this.factoidModel.findOneAndUpdate(
      filter,
      { $set: update },
      options,
    );

    if (!result) {
      throw new Error('Failed to create or update factoid');
    }

    return result.toObject();
  }

  async update(
    id: string,
    factoid: Partial<IFactoid>,
  ): Promise<IFactoid | null> {
    const result = await this.factoidModel.findByIdAndUpdate(
      id,
      { $set: factoid },
      { new: true },
    );

    return result ? result.toObject() : null;
  }

  async findBySubject(
    chatId: string,
    subject: string,
  ): Promise<IFactoid | null> {
    const result = await this.factoidModel
      .findOne({
        chatId,
        subject: { $regex: new RegExp(`^${this.escapeRegex(subject)}$`, 'i') },
        deletedAt: { $exists: false },
      })
      .sort({ confidence: -1, updatedAt: -1 });

    return result ? result.toObject() : null;
  }

  async findByChatId(chatId: string, limit = 100): Promise<IFactoid[]> {
    const results = await this.factoidModel
      .find({
        chatId,
        deletedAt: { $exists: false },
      })
      .sort({ confidence: -1, updatedAt: -1 })
      .limit(limit);

    return results.map((doc) => doc.toObject());
  }

  async searchByText(
    chatId: string,
    query: string,
    limit = 10,
    offset = 0,
  ): Promise<IFactoid[]> {
    // Use MongoDB text search for performance
    const results = await this.factoidModel
      .find({
        chatId,
        deletedAt: { $exists: false },
        $text: { $search: query },
      })
      .sort({ score: { $meta: 'textScore' }, confidence: -1 })
      .limit(limit)
      .skip(offset);

    return results.map((doc) => doc.toObject());
  }

  async delete(id: string): Promise<boolean> {
    // Soft delete
    const result = await this.factoidModel.findByIdAndUpdate(
      id,
      { $set: { deletedAt: new Date() } },
      { new: true },
    );

    return !!result;
  }

  async countByChatId(chatId: string): Promise<number> {
    return this.factoidModel.countDocuments({
      chatId,
      deletedAt: { $exists: false },
    });
  }

  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
