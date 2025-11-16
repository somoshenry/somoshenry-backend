import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';

export interface RoomChatMessage {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  message: string;
  timestamp: Date;
  createdAt?: Date;
  isRead?: boolean;
}

// Schema para MongoDB
export interface RoomChatMessageDocument {
  _id: { toString(): string };
  roomId: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  message: string;
  timestamp?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

@Injectable()
export class RoomChatService {
  constructor(
    @InjectModel('RoomChatMessage')
    private readonly messageModel: Model<RoomChatMessageDocument>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async saveMessage(data: {
    roomId: string;
    userId: string;
    userName: string;
    userAvatar?: string | null;
    message: string;
  }): Promise<RoomChatMessage> {
    const doc = await this.messageModel.create({
      roomId: data.roomId,
      userId: data.userId,
      userName: data.userName,
      userAvatar: data.userAvatar,
      message: data.message,
      timestamp: new Date(),
      createdAt: new Date(),
    });

    return this.toFrontendFormat(doc as RoomChatMessageDocument);
  }

  async getMessages(
    roomId: string,
    limit: number = 50,
  ): Promise<RoomChatMessage[]> {
    const messages = await this.messageModel
      .find({ roomId })
      .sort({ timestamp: 1 })
      .limit(limit)
      .exec();

    return (messages as RoomChatMessageDocument[]).map((msg) =>
      this.toFrontendFormat(msg),
    );
  }

  async deleteRoomMessages(roomId: string): Promise<number> {
    const result = await this.messageModel.deleteMany({ roomId }).exec();
    return result.deletedCount || 0;
  }

  private toFrontendFormat(doc: RoomChatMessageDocument): RoomChatMessage {
    return {
      id: doc._id.toString(),
      roomId: doc.roomId,
      userId: doc.userId,
      userName: doc.userName,
      userAvatar: doc.userAvatar,
      message: doc.message,
      timestamp: doc.timestamp || doc.createdAt,
      createdAt: doc.createdAt,
      isRead: false,
    };
  }
}
