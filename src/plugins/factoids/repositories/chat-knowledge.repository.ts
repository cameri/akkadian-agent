import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatKnowledge } from '../schemas/chat-knowledge.schema';
import type {
  IChatKnowledge,
  IChatKnowledgeRepository,
} from '../factoids.types';

@Injectable()
export class ChatKnowledgeRepository implements IChatKnowledgeRepository {
  constructor(
    @InjectModel(ChatKnowledge.name)
    private readonly chatKnowledgeModel: Model<ChatKnowledge>,
  ) {}

  async findByChatId(chatId: string): Promise<IChatKnowledge | null> {
    const result = await this.chatKnowledgeModel.findOne({ chatId });
    return result ? result.toObject() : null;
  }

  async create(knowledge: IChatKnowledge): Promise<IChatKnowledge> {
    const { chatId, ...update } = knowledge;
    const filter = { chatId };
    const options = {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    };

    const result = await this.chatKnowledgeModel.findOneAndUpdate(
      filter,
      { $set: update },
      options,
    );

    if (!result) {
      throw new Error('Failed to create or update chat knowledge');
    }

    return result.toObject();
  }

  async update(
    id: string,
    knowledge: Partial<IChatKnowledge>,
  ): Promise<IChatKnowledge | null> {
    const result = await this.chatKnowledgeModel.findByIdAndUpdate(
      id,
      { $set: knowledge },
      { new: true },
    );

    return result ? result.toObject() : null;
  }

  async incrementFactCount(chatId: string): Promise<void> {
    await this.chatKnowledgeModel.findOneAndUpdate(
      { chatId },
      {
        $inc: { factCount: 1 },
        $set: { lastActivity: new Date() },
      },
      { upsert: true },
    );
  }

  async decrementFactCount(chatId: string): Promise<void> {
    await this.chatKnowledgeModel.findOneAndUpdate(
      { chatId },
      {
        $inc: { factCount: -1 },
        $set: { lastActivity: new Date() },
      },
    );
  }
}
