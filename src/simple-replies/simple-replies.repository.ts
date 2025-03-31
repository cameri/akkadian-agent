import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { SimpleReply } from './models/simple-reply.model';

@Injectable()
export class SimpleRepliesRepository {
  constructor(
    @Inject(SimpleReply) private readonly model: Model<SimpleReply>,
  ) {}

  async create(pattern: string, response: string): Promise<boolean> {
    const result = await this.model.create({
      pattern,
      response,
    });

    return result.isNew;
  }

  async delete(pattern: string): Promise<boolean> {
    const result = await this.model.deleteOne({ pattern });

    return result.deletedCount > 0;
  }
}
