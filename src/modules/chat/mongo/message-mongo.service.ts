import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MessageMongo, MessageMongoDocument } from './message-mongo.schema';

export interface MessageMongoResponse {
  id: string;
  conversationId: string;
  senderId: string;
  content?: string;
  type?: string;
  attachments?: Record<string, unknown> | null;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable()
export class MessageMongoService {
  constructor(
    @InjectModel(MessageMongo.name)
    private readonly messageModel: Model<MessageMongoDocument>,
  ) {}

  async createMessage(data: {
    conversationId: string;
    senderId: string;
    content?: string;
    type?: string;
    attachments?: Record<string, unknown>;
  }): Promise<MessageMongoResponse> {
    const created = await this.messageModel.create(data);
    return this.toFrontendFormat(created);
  }

  async getMessagesByConversation(
    conversationId: string,
  ): Promise<MessageMongoResponse[]> {
    const messages = await this.messageModel
      .find({ conversationId })
      .sort({ createdAt: 1 })
      .exec();

    return messages.map((m: MessageMongoDocument) => this.toFrontendFormat(m));
  }

  // 🔥 MAPPER tipado → sin any, sin unknown
  private toFrontendFormat(doc: MessageMongoDocument): MessageMongoResponse {
    return {
      id: String(doc._id),
      conversationId: doc.conversationId,
      senderId: doc.senderId,
      content: doc.content,
      type: doc.type,
      attachments: doc.attachments ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  async countMessages(conversationId: string): Promise<number> {
    return this.messageModel.countDocuments({ conversationId }).exec();
  }

  async getMessagesPaginated(
    conversationId: string,
    page: number,
    limit: number,
  ): Promise<MessageMongoResponse[]> {
    const docs = await this.messageModel
      .find({ conversationId })
      .sort({ createdAt: -1 }) // DESC
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    return docs.map((doc) => this.toFrontendFormat(doc));
  }
}
