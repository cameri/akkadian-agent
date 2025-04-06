import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Optional } from '../@types/base';
import { Reply } from './schemas/reply.schema';
import { IReply, IReplyRepository } from './simple-replies.types';

@Injectable()
export class ReplyRepository implements IReplyRepository {
  constructor(
    @InjectModel(Reply.name)
    private readonly simpleReplyModel: Model<Reply>,
  ) {}

  async create(reply: IReply): Promise<IReply | null> {
    const { pattern, ...update } = reply;
    const filter = { pattern };
    const options = {
      upsert: true,
      new: true,
    };

    const result: IReply | null = await this.simpleReplyModel.findOneAndUpdate(
      filter,
      update,
      options,
    );

    return result;
  }

  async delete(pattern: string): Promise<boolean> {
    const result = await this.simpleReplyModel.deleteOne({ pattern });

    return result.deletedCount > 0;
  }

  async findOneByPattern(pattern: string): Promise<Optional<IReply>> {
    const result = await this.simpleReplyModel.findOne({ pattern });
    if (!result) {
      return;
    }

    return result;
  }
}
