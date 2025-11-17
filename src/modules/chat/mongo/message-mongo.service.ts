import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MessageMongo, MessageMongoDocument } from './message-mongo.schema';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../user/entities/user.entity';

export interface MessageMongoResponse {
  id: string;
  conversationId: string;
  senderId: string;
  content?: string;
  type?: string;
  attachments?: Record<string, unknown> | null;
  createdAt?: Date;
  updatedAt?: Date;
  isRead?: boolean;
  readAt?: Date | null;

  sender?: {
    id: string;
    name: string;
    avatar?: string | null;
  };

  conversation?: {
    id: string;
  };
}

@Injectable()
export class MessageMongoService {
  constructor(
    @InjectModel(MessageMongo.name)
    private readonly messageModel: Model<MessageMongoDocument>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async createMessage(data: {
    conversationId: string;
    senderId: string;
    content?: string;
    type?: string;
    attachments?: Record<string, unknown>;
  }): Promise<MessageMongoResponse> {
    const created = await this.messageModel.create({
      ...data,
      isRead: false,
      readAt: null,
    });

    return await this.toFrontendFormat(created);
  }

  async getMessagesByConversation(
    conversationId: string,
  ): Promise<MessageMongoResponse[]> {
    const messages = await this.messageModel
      .find({ conversationId })
      .sort({ createdAt: 1 })
      .exec();

    return await Promise.all(messages.map((msg) => this.toFrontendFormat(msg)));
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
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    return await Promise.all(docs.map((doc) => this.toFrontendFormat(doc)));
  }

  // Marcar mensaje como leído
  async markAsRead(messageId: string): Promise<MessageMongoResponse | null> {
    try {
      const updated = await this.messageModel
        .findByIdAndUpdate(
          messageId,
          {
            isRead: true,
            readAt: new Date(),
          },
          { new: true }, // Devolver el documento actualizado
        )
        .exec();

      if (!updated) {
        console.warn(`Mensaje ${messageId} no encontrado en MongoDB`);
        return null;
      }

      return await this.toFrontendFormat(updated);
    } catch (error) {
      console.error('Error al marcar mensaje como leído:', error);
      return null;
    }
  }

  // Eliminar todos los mensajes de una conversación
  async deleteMessagesByConversation(conversationId: string): Promise<number> {
    try {
      const result = await this.messageModel
        .deleteMany({ conversationId })
        .exec();

      console.log(
        `${result.deletedCount} mensajes eliminados de la conversación ${conversationId}`,
      );
      return result.deletedCount || 0;
    } catch (error) {
      console.error('Error eliminando mensajes:', error);
      throw error;
    }
  }

  // Eliminar un mensaje específico
  async deleteMessage(messageId: string): Promise<boolean> {
    try {
      const result = await this.messageModel
        .findByIdAndDelete(messageId)
        .exec();
      return !!result;
    } catch (error) {
      console.error('Error eliminando mensaje:', error);
      return false;
    }
  }

  // Obtener último mensaje de una conversación
  async getLastMessage(
    conversationId: string,
  ): Promise<MessageMongoResponse | null> {
    try {
      const message = await this.messageModel
        .findOne({ conversationId })
        .sort({ createdAt: -1 })
        .limit(1)
        .exec();

      if (!message) return null;

      return await this.toFrontendFormat(message);
    } catch (error) {
      console.error('Error obteniendo último mensaje:', error);
      return null;
    }
  }

  // Método crítico que formatea para el frontend
  private async toFrontendFormat(
    doc: MessageMongoDocument,
  ): Promise<MessageMongoResponse> {
    const sender = await this.userRepo.findOne({
      where: { id: doc.senderId },
    });

    return {
      id: String(doc._id),
      conversationId: doc.conversationId,
      senderId: doc.senderId,
      content: doc.content,
      type: doc.type,
      attachments: doc.attachments ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      isRead: doc.isRead ?? false,
      readAt: doc.readAt ?? null,

      sender: {
        id: sender?.id ?? doc.senderId,
        name: sender?.name ?? 'Usuario',
        avatar: sender?.profilePicture ?? null,
      },

      conversation: {
        id: doc.conversationId,
      },
    };
  }
}
