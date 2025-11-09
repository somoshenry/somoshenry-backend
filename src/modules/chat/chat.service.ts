import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message, MessageType } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { User } from '../user/entities/user.entity';
// import { v2 as cloudinary } from 'cloudinary';
import { DeleteConversationResponseDto } from './dto/delete-conversation-response.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FilesRepository } from '../files/files.repository';
import { MessageAttachment } from './entities/message-attachment.entity';
import { SendMessageWithFilesDto } from './dto/send-message-with-files.dto';
import { ChatGateway } from './chat.gateway';
import { forwardRef, Inject } from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { ConversationType } from './entities/conversation.entity';
import {
  ConversationParticipant,
  ConversationRole,
} from './entities/conversation-participant.entity';
import { EventDispatcherService } from '../../common/events/event-dispatcher.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly eventEmitter: EventEmitter2,
    @InjectRepository(MessageAttachment)
    private readonly attachmentRepo: Repository<MessageAttachment>,
    private readonly filesRepository: FilesRepository,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
    @InjectRepository(ConversationParticipant)
    private readonly participantRepo: Repository<ConversationParticipant>,
    private readonly eventDispatcher: EventDispatcherService,
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

    const saved = await this.messageRepo.save(message);
    conversation.updatedAt = new Date();
    await this.conversationRepo.save(conversation);

    // ✅ Nuevo: emitir evento para crear notificación sin romper el front
    const receiver = conversation.participants.find((p) => p.id !== senderId);
    if (receiver) {
      this.eventEmitter.emit('message.created', {
        senderId,
        receiverId: receiver.id,
        message: {
          id: saved.id,
          content: saved.content,
          conversationId: conversation.id,
        },
      });
    }

    return saved; // mantiene la respuesta igual para el frontend
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

  async getConversationById(id: string) {
    return this.conversationRepo.findOne({
      where: { id },
      relations: ['participants'],
    });
  }

  async sendMessageWithFiles(
    senderId: string,
    dto: SendMessageWithFilesDto,
    files: Express.Multer.File[],
  ): Promise<Message> {
    const { peerUserId, text, linkUrl } = dto;

    if (senderId === peerUserId)
      throw new BadRequestException('No puedes chatear contigo mismo');

    const [sender, peer] = await Promise.all([
      this.userRepo.findOneBy({ id: senderId }),
      this.userRepo.findOneBy({ id: peerUserId }),
    ]);
    if (!sender || !peer) throw new NotFoundException('Usuario no encontrado');

    // ✅ Buscar conversación existente por participantes
    let conversation = await this.conversationRepo
      .createQueryBuilder('c')
      .leftJoin('c.participants', 'p')
      .where('p.id IN (:...ids)', { ids: [senderId, peerUserId] })
      .groupBy('c.id')
      .having('COUNT(p.id) = 2')
      .getOne();

    if (!conversation) {
      conversation = this.conversationRepo.create({
        participants: [sender, peer],
      });
      conversation = await this.conversationRepo.save(conversation);
    }

    // ✅ Validar y limitar cantidad de archivos
    const safeFiles = Array.isArray(files) ? files : [];
    if (safeFiles.length > 10) {
      throw new BadRequestException('Máximo 10 archivos por mensaje');
    }

    // ✅ Subir archivos a Cloudinary
    const attachments: MessageAttachment[] = [];
    for (const file of safeFiles) {
      const uploaded = await this.filesRepository.uploadFile(file);
      const attachment = this.attachmentRepo.create({
        url: uploaded.secure_url,
        publicId: uploaded.public_id,
        format: uploaded.format,
        resourceType: uploaded.resource_type, // 'image' | 'video' | 'raw' | 'audio'
      });
      attachments.push(attachment);
    }

    // ✅ Determinar tipo de mensaje
    let type = MessageType.TEXT;
    if (attachments.length > 0) {
      const rt = attachments[0].resourceType;
      if (rt === 'image') type = MessageType.IMAGE;
      else if (rt === 'video') type = MessageType.VIDEO;
      else if (rt === 'audio') type = MessageType.AUDIO;
      else type = MessageType.FILE;
    } else if (linkUrl) {
      type = MessageType.LINK;
    }

    // ✅ Crear y guardar mensaje
    const message = this.messageRepo.create({
      conversation,
      sender,
      type,
      content: text ?? linkUrl ?? null,
      attachments,
    });

    const saved = await this.messageRepo.save(message);

    // ✅ Actualizar timestamp de la conversación
    conversation.updatedAt = new Date();
    await this.conversationRepo.save(conversation);

    // ✅ Emitir notificación (back → front)
    const receiver = conversation.participants.find((p) => p.id !== senderId);
    if (receiver) {
      this.eventEmitter.emit('message.created', {
        senderId,
        receiverId: receiver.id,
        message: {
          id: saved.id,
          content: saved.content,
          conversationId: conversation.id,
        },
      });
    }

    // ✅ EMITIR EN TIEMPO REAL 🚀
    this.chatGateway.emitNewMessage(saved);

    return saved;
  }

  async createGroup(creatorId: string, dto: CreateGroupDto) {
    const creator = await this.userRepo.findOne({ where: { id: creatorId } });
    if (!creator) throw new NotFoundException('Creador no encontrado');

    // Crear la conversación del grupo
    const conversation = this.conversationRepo.create({
      type: ConversationType.GROUP,
      name: dto.name,
      description: dto.description ?? null,
      imageUrl: dto.imageUrl ?? null,
    });
    await this.conversationRepo.save(conversation);

    // Crear el registro del creador como ADMIN
    const participants: ConversationParticipant[] = [];
    participants.push(
      this.participantRepo.create({
        conversation,
        user: creator,
        role: ConversationRole.ADMIN,
      }),
    );

    // Si hay miembros adicionales, los agregamos como MEMBER
    if (dto.memberIds?.length) {
      const members = await this.userRepo.findByIds(dto.memberIds);
      members.forEach((member) => {
        participants.push(
          this.participantRepo.create({
            conversation,
            user: member,
            role: ConversationRole.MEMBER,
          }),
        );
      });
    }

    await this.participantRepo.save(participants);

    return {
      ...conversation,
      participants,
    };
  }

  async sendGroupMessage(
    senderId: string,
    groupId: string,
    content: string,
    type: MessageType = MessageType.TEXT,
  ): Promise<Message> {
    const [conversation, sender] = await Promise.all([
      this.conversationRepo.findOne({
        where: { id: groupId },
        relations: ['messages'],
      }),
      this.userRepo.findOne({ where: { id: senderId } }),
    ]);

    if (!conversation) throw new NotFoundException('Grupo no encontrado');
    if (!sender) throw new NotFoundException('Usuario no encontrado');

    // Validamos que el usuario pertenezca al grupo
    const isMember = await this.participantRepo.exists({
      where: { conversation: { id: groupId }, user: { id: senderId } },
    });
    if (!isMember) throw new BadRequestException('No perteneces a este grupo');

    const message = this.messageRepo.create({
      sender,
      conversation,
      content,
      type,
    });

    await this.messageRepo.save(message);
    return message;
  }

  async getUserGroups(userId: string) {
    // Buscar todos los registros donde el usuario participa
    const participations = await this.participantRepo.find({
      where: { user: { id: userId } },
      relations: ['conversation'],
    });

    // Filtrar solo los grupos (no privados ni cohortes)
    const groups = participations
      .map((p) => p.conversation)
      .filter((c) => c.type === ConversationType.GROUP);

    return groups;
  }
  async promoteMemberToAdmin(
    groupId: string,
    requesterId: string,
    targetUserId: string,
  ): Promise<ConversationParticipant> {
    const requester = await this.participantRepo.findOne({
      where: { conversation: { id: groupId }, user: { id: requesterId } },
    });
    if (!requester) throw new ForbiddenException('No perteneces a este grupo');
    if (requester.role !== ConversationRole.ADMIN)
      throw new ForbiddenException('No tienes permisos para promover miembros');

    const target = await this.participantRepo.findOne({
      where: { conversation: { id: groupId }, user: { id: targetUserId } },
      relations: ['user'],
    });
    if (!target) throw new NotFoundException('Miembro no encontrado');

    target.role = ConversationRole.ADMIN;
    await this.participantRepo.save(target);

    // Emitir evento interno
    this.eventDispatcher.dispatch({
      name: 'group.member.promoted',
      payload: { groupId, targetUserId },
    });

    return target;
  }

  /**
   * Elimina a un miembro de un grupo (solo admin).
   */
  async removeMemberFromGroup(
    groupId: string,
    requesterId: string,
    targetUserId: string,
  ): Promise<void> {
    const requester = await this.participantRepo.findOne({
      where: { conversation: { id: groupId }, user: { id: requesterId } },
    });
    if (!requester) throw new ForbiddenException('No perteneces a este grupo');
    if (requester.role !== ConversationRole.ADMIN)
      throw new ForbiddenException('No tienes permisos para eliminar miembros');

    const target = await this.participantRepo.findOne({
      where: { conversation: { id: groupId }, user: { id: targetUserId } },
      relations: ['user'],
    });
    if (!target) throw new NotFoundException('Miembro no encontrado');

    await this.participantRepo.remove(target);

    // Emitir evento interno
    this.eventDispatcher.dispatch({
      name: 'group.member.removed',
      payload: { groupId, targetUserId },
    });
  }

  /**
   * Permite que un usuario abandone voluntariamente un grupo.
   */
  async leaveGroup(groupId: string, userId: string): Promise<void> {
    const participant = await this.participantRepo.findOne({
      where: { conversation: { id: groupId }, user: { id: userId } },
      relations: ['user'],
    });
    if (!participant) throw new NotFoundException('No perteneces a este grupo');

    await this.participantRepo.remove(participant);

    // Emitir evento interno
    this.eventDispatcher.dispatch({
      name: 'group.member.left',
      payload: { groupId, userId },
    });
  }
}
