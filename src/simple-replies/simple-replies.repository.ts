import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SimpleReply } from './models/simple-reply.model';

@Injectable()
export class SimpleRepliesRepository {
  constructor(
    @InjectModel(SimpleReply.name)
    private readonly simpleReplyModel: Model<SimpleReply>,
  ) {}

  async create(pattern: string, response: string): Promise<boolean> {
    const result = await this.simpleReplyModel.create({
      pattern,
      response,
    });

    return result.isNew;
  }

  async delete(pattern: string): Promise<boolean> {
    const result = await this.simpleReplyModel.deleteOne({ pattern });

    return result.deletedCount > 0;
  }

  async findOneByPattern(pattern: string): Promise<SimpleReply | null> {
    return this.simpleReplyModel.findOne({ pattern });
  }
}
