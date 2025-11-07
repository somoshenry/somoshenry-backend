import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message, MessageType } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { User } from '../user/entities/user.entity';
import { v2 as cloudinary } from 'cloudinary';
import { DeleteConversationResponseDto } from './dto/delete-conversation-response.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async openConversation(
    userId: string,
    peerUserId: string,
  ): Promise<Conversation> {
    if (userId === peerUserId)
      throw new BadRequestException('No puedes abrir chat contigo mismo');

    const [user, peer] = await Promise.all([
      this.userRepo.findOne({ where: { id: userId } }),
      this.userRepo.findOne({ where: { id: peerUserId } }),
    ]);
    if (!peer) throw new NotFoundException('Usuario destino no encontrado');

    const existing: Conversation | null = await this.conversationRepo
      .createQueryBuilder('c')
      .leftJoin('c.participants', 'p')
      .where('p.id IN (:...ids)', { ids: [userId, peerUserId] })
      .groupBy('c.id')
      .having('COUNT(p.id) = 2')
      .getOne();

    if (existing) return existing;

    const conversation = this.conversationRepo.create({
      participants: [user as User, peer as User],
    });
    return await this.conversationRepo.save(conversation);
  }

  async getUserConversations(userId: string): Promise<Conversation[]> {
    return this.conversationRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.participants', 'p')
      .leftJoinAndSelect('c.messages', 'm')
      .leftJoinAndSelect('m.sender', 's')
      .where('p.id = :id', { id: userId })
      .orderBy('c.updated_at', 'DESC')
      .getMany();
  }

  async getMessages(
    conversationId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: Message[]; meta: Record<string, any> }> {
    const [messages, total] = await this.messageRepo.findAndCount({
      where: { conversation: { id: conversationId } },
      order: { createdAt: 'DESC' },
      relations: ['sender'],
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: messages.reverse(),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async sendMessage(senderId: string, dto: CreateMessageDto): Promise<Message> {
    const conversation = await this.conversationRepo.findOne({
      where: { id: dto.conversationId },
      relations: ['participants'],
    });
    if (!conversation)
      throw new NotFoundException('Conversación no encontrada');

    const sender = await this.userRepo.findOne({ where: { id: senderId } });
    if (!sender) throw new NotFoundException('Usuario no encontrado');

    const message = this.messageRepo.create({
      conversation,
      sender,
      type: dto.type || MessageType.TEXT,
      content: dto.content || null,
      mediaUrl: dto.mediaUrl || null,
    });

    const saved: Message = await this.messageRepo.save(message);
    conversation.updatedAt = new Date();
    await this.conversationRepo.save(conversation);
    return saved;
  }

  async markMessageAsRead(messageId: string): Promise<Message> {
    const message = await this.messageRepo.findOne({
      where: { id: messageId },
    });
    if (!message) throw new NotFoundException('Mensaje no encontrado');
    message.isRead = true;
    message.readAt = new Date();
    return await this.messageRepo.save(message);
  }

  async uploadMedia(file: Express.Multer.File): Promise<{ url: string }> {
    if (!file) throw new BadRequestException('No se recibió archivo');
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'chat_media',
        resource_type: 'auto',
      });
      return { url: result.secure_url };
    } catch {
      throw new BadRequestException('Error al subir a Cloudinary');
    }
  }

  async deleteConversation(
    conversationId: string,
    userId: string,
  ): Promise<DeleteConversationResponseDto> {
    const conversation: Conversation | null =
      await this.conversationRepo.findOne({
        where: { id: conversationId },
        relations: ['participants', 'messages'],
      });

    if (!conversation) {
      throw new NotFoundException('Conversación no encontrada');
    }

    const isParticipant: boolean = conversation.participants.some(
      (p: User) => p.id === userId,
    );

    if (!isParticipant) {
      throw new BadRequestException(
        'No tienes permiso para eliminar esta conversación',
      );
    }

    await this.conversationRepo.remove(conversation);

    return {
      message: 'Conversación eliminada permanentemente',
      conversationId,
      deletedAt: new Date(),
    };
  }
}
