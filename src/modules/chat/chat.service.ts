// NESTJS
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
// TYPEORM
import { Repository } from 'typeorm';
// CACHE
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
// EVENT
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventDispatcherService } from '../../common/events/event-dispatcher.service';
// ENTITIES (solo las que necesitamos)
import { Conversation, ConversationType } from './entities/conversation.entity';
import { MessageType } from './entities/message.entity'; // Solo el enum
import { User } from '../user/entities/user.entity';
import {
  ConversationParticipant,
  ConversationRole,
} from './entities/conversation-participant.entity';
// DTO
import { CreateMessageDto } from './dto/create-message.dto';
import { SendMessageWithFilesDto } from './dto/send-message-with-files.dto';
import { DeleteConversationResponseDto } from './dto/delete-conversation-response.dto';
import { CreateGroupDto } from './dto/create-group.dto';
// EN VIVO Y FILES
import { FilesRepository } from '../files/files.repository';
import { ChatGateway } from './chat.gateway';
// MONGODB (única fuente de verdad para mensajes)
import { MessageMongoService } from './mongo/message-mongo.service';
import { MessageMongoResponse } from './mongo/message-mongo.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(ConversationParticipant)
    private readonly participantRepo: Repository<ConversationParticipant>,

    // MongoDB service (única fuente para mensajes)
    private readonly messageMongoService: MessageMongoService,

    private readonly filesRepository: FilesRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly eventDispatcher: EventDispatcherService,

    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,

    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  /**
   * Obtiene todas las conversaciones del usuario con sus últimos mensajes desde MongoDB
   */
  async getUserConversations(userId: string): Promise<any[]> {
    const cacheKey = `user:conversations:${userId}`;
    const cached = await this.cacheManager.get<any[]>(cacheKey);

    if (cached) {
      console.log('⚡ Conversaciones desde Redis');
      return cached;
    }

    console.log('📡 Consultando conversaciones y mensajes desde MongoDB...');

    // Traer conversaciones (solo metadata, sin mensajes de PostgreSQL)
    const conversations = await this.conversationRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.participants', 'p')
      .where('p.id = :id', { id: userId })
      .orderBy('c.updated_at', 'DESC')
      .getMany();

    // Para cada conversación, cargar últimos mensajes desde MongoDB
    const conversationsWithMessages = await Promise.all(
      conversations.map(async (conv) => {
        try {
          const mongoMessages =
            await this.messageMongoService.getMessagesPaginated(conv.id, 1, 20);

          const messages = [...mongoMessages].reverse();

          return {
            ...conv,
            messages,
          };
        } catch (error) {
          console.error(`❌ Error cargando mensajes para ${conv.id}:`, error);
          return {
            ...conv,
            messages: [],
          };
        }
      }),
    );

    await this.cacheManager.set(cacheKey, conversationsWithMessages, 30);
    console.log('💾 Conversaciones cacheadas con mensajes de MongoDB');

    return conversationsWithMessages;
  }

  /**
   * Abre o crea una conversación 1-a-1
   */
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

    // Buscar conversación existente
    const existing: Conversation | null = await this.conversationRepo
      .createQueryBuilder('c')
      .leftJoin('c.participants', 'p')
      .where('p.id IN (:...ids)', { ids: [userId, peerUserId] })
      .groupBy('c.id')
      .having('COUNT(p.id) = 2')
      .getOne();

    if (existing) return existing;

    // Crear nueva conversación
    const conversation = this.conversationRepo.create({
      participants: [user as User, peer as User],
    });
    const saved = await this.conversationRepo.save(conversation);

    // Limpiar cache
    await this.cacheManager.del(`user:conversations:${userId}`);
    await this.cacheManager.del(`user:conversations:${peerUserId}`);

    return saved;
  }

  /**
   * Elimina una conversación y todos sus mensajes de MongoDB
   */
  async deleteConversation(
    conversationId: string,
    userId: string,
  ): Promise<DeleteConversationResponseDto> {
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId },
      relations: ['participants'],
    });

    if (!conversation)
      throw new NotFoundException('Conversación no encontrada');

    const isParticipant = conversation.participants.some(
      (p) => p.id === userId,
    );

    if (!isParticipant)
      throw new BadRequestException(
        'No tienes permiso para eliminar esta conversación',
      );

    // Eliminar mensajes de MongoDB
    try {
      const deleted =
        await this.messageMongoService.deleteMessagesByConversation(
          conversationId,
        );
      console.log(`🗑️ ${deleted} mensajes eliminados de MongoDB`);
    } catch (error) {
      console.error('❌ Error eliminando mensajes de MongoDB:', error);
    }

    // Eliminar conversación de PostgreSQL
    await this.conversationRepo.remove(conversation);

    // Limpiar cache
    await this.cacheManager.del(`chat:messages:${conversationId}`);
    for (const p of conversation.participants) {
      await this.cacheManager.del(`user:conversations:${p.id}`);
    }

    return {
      message: 'Conversación eliminada permanentemente',
      conversationId,
      deletedAt: new Date(),
    };
  }

  /**
   * Obtiene mensajes paginados de una conversación desde MongoDB
   */
  async getMessages(
    conversationId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: any[]; meta: Record<string, any> }> {
    const cacheKey = `chat:messages:${conversationId}:page:${page}`;
    const cached = await this.cacheManager.get<{
      data: any[];
      meta: Record<string, any>;
    }>(cacheKey);

    if (cached) {
      console.log('⚡ Mensajes desde Redis');
      return cached;
    }

    console.log('📡 Consultando mensajes desde MongoDB...');

    const total = await this.messageMongoService.countMessages(conversationId);
    const messagesDesc = await this.messageMongoService.getMessagesPaginated(
      conversationId,
      page,
      limit,
    );

    const messages = [...messagesDesc].reverse();

    const response = {
      data: messages,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    await this.cacheManager.set(cacheKey, response, 30);

    return response;
  }

  /**
   * Envía un mensaje de texto (MongoDB)
   */
  async sendMessage(
    senderId: string,
    dto: CreateMessageDto,
  ): Promise<MessageMongoResponse> {
    const conversation = await this.conversationRepo.findOne({
      where: { id: dto.conversationId },
      relations: ['participants'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversación no encontrada');
    }

    const sender = await this.userRepo.findOne({ where: { id: senderId } });
    if (!sender) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Guardar en MongoDB
    const saved = await this.messageMongoService.createMessage({
      conversationId: dto.conversationId,
      senderId,
      content: dto.content ?? undefined,
      type: dto.type || MessageType.TEXT,
      attachments: dto.mediaUrl ? { mediaUrl: dto.mediaUrl } : undefined,
    });

    // Actualizar timestamp de conversación
    conversation.updatedAt = new Date();
    await this.conversationRepo.save(conversation);

    // Limpiar cache
    await this.cacheManager.del(`chat:messages:${dto.conversationId}`);
    for (const p of conversation.participants) {
      await this.cacheManager.del(`user:conversations:${p.id}`);
    }

    // Emitir evento interno
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

    // Emitir por WebSocket
    this.chatGateway.emitNewMessage(saved);

    return saved;
  }

  /**
   * Marca un mensaje como leído en MongoDB
   */
  async markMessageAsRead(messageId: string): Promise<any> {
    try {
      const updated = await this.messageMongoService.markAsRead(messageId);
      if (updated) {
        console.log('✅ Mensaje marcado como leído');
        return updated;
      }
    } catch (error) {
      console.error('❌ Error marcando mensaje como leído:', error);
    }

    return {
      id: messageId,
      isRead: true,
      readAt: new Date(),
    };
  }

  /**
   * Obtiene una conversación por ID
   */
  async getConversationById(id: string) {
    return this.conversationRepo.findOne({
      where: { id },
      relations: ['participants'],
    });
  }

  /**
   * Envía un mensaje con archivos (imágenes, videos, etc.)
   * TODO: Migrar a MongoDB cuando el frontend lo use
   */
  async sendMessageWithFiles(
    senderId: string,
    dto: SendMessageWithFilesDto,
    files: Express.Multer.File[],
  ): Promise<any> {
    const { peerUserId, text, linkUrl } = dto;

    if (senderId === peerUserId)
      throw new BadRequestException('No puedes chatear contigo mismo');

    const [sender, peer] = await Promise.all([
      this.userRepo.findOneBy({ id: senderId }),
      this.userRepo.findOneBy({ id: peerUserId }),
    ]);

    if (!sender || !peer) throw new NotFoundException('Usuario no encontrado');

    // Buscar o crear conversación
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

    // Validar archivos
    const safeFiles = Array.isArray(files) ? files : [];
    if (safeFiles.length > 10) {
      throw new BadRequestException('Máximo 10 archivos por mensaje');
    }

    // Subir a Cloudinary
    const uploadedFiles: Array<{ url: string; type: string }> = [];
    for (const file of safeFiles) {
      const uploaded = await this.filesRepository.uploadFile(file);
      uploadedFiles.push({
        url: uploaded.secure_url,
        type: uploaded.resource_type,
      });
    }

    // Determinar tipo de mensaje
    let type = MessageType.TEXT;
    if (uploadedFiles.length > 0) {
      const rt = uploadedFiles[0].type;
      if (rt === 'image') type = MessageType.IMAGE;
      else if (rt === 'video') type = MessageType.VIDEO;
      else if (rt === 'audio') type = MessageType.AUDIO;
      else type = MessageType.FILE;
    } else if (linkUrl) {
      type = MessageType.LINK;
    }

    // Guardar en MongoDB
    const saved = await this.messageMongoService.createMessage({
      conversationId: conversation.id,
      senderId: sender.id,
      content: text ?? linkUrl ?? undefined,
      type,
      attachments:
        uploadedFiles.length > 0 ? { files: uploadedFiles } : undefined,
    });

    // Actualizar conversación
    conversation.updatedAt = new Date();
    await this.conversationRepo.save(conversation);

    // Limpiar cache
    await this.cacheManager.del(`chat:messages:${conversation.id}`);
    for (const p of conversation.participants) {
      await this.cacheManager.del(`user:conversations:${p.id}`);
    }

    // Eventos
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

    this.chatGateway.emitNewMessage(saved);

    return saved;
  }

  // ==================== GRUPOS ====================

  /**
   * Crea un grupo de chat
   */
  async createGroup(creatorId: string, dto: CreateGroupDto) {
    const creator = await this.userRepo.findOne({ where: { id: creatorId } });
    if (!creator) throw new NotFoundException('Creador no encontrado');

    const conversation = this.conversationRepo.create({
      type: ConversationType.GROUP,
      name: dto.name,
      description: dto.description ?? null,
      imageUrl: dto.imageUrl ?? null,
    });
    await this.conversationRepo.save(conversation);

    const inputIds = Array.from(
      new Set([...(dto.memberIds ?? []).filter((id) => id !== creatorId)]),
    );
    const members = inputIds.length
      ? await this.userRepo.findByIds(inputIds)
      : [];

    const participants: ConversationParticipant[] = [
      this.participantRepo.create({
        conversation,
        user: creator,
        role: ConversationRole.ADMIN,
      }),
      ...members.map((m) =>
        this.participantRepo.create({
          conversation,
          user: m,
          role: ConversationRole.MEMBER,
        }),
      ),
    ];

    await this.participantRepo.save(participants);

    this.eventDispatcher.dispatch({
      name: 'group.created',
      payload: {
        groupId: conversation.id,
        name: conversation.name,
        imageUrl: conversation.imageUrl,
        members: [creatorId, ...members.map((m) => m.id)],
      },
    });

    return { ...conversation, participants };
  }

  /**
   * Envía un mensaje a un grupo (MongoDB)
   */
  async sendGroupMessage(
    senderId: string,
    groupId: string,
    content: string,
    type: MessageType = MessageType.TEXT,
  ): Promise<any> {
    const [conversation, sender] = await Promise.all([
      this.conversationRepo.findOne({
        where: { id: groupId },
        relations: ['participants'],
      }),
      this.userRepo.findOne({ where: { id: senderId } }),
    ]);

    if (!conversation) throw new NotFoundException('Grupo no encontrado');
    if (!sender) throw new NotFoundException('Usuario no encontrado');

    const isMember = await this.participantRepo.exists({
      where: { conversation: { id: groupId }, user: { id: senderId } },
    });

    if (!isMember) throw new BadRequestException('No perteneces a este grupo');

    // Guardar en MongoDB
    const saved = await this.messageMongoService.createMessage({
      conversationId: groupId,
      senderId: sender.id,
      content,
      type,
    });

    // Actualizar conversación
    conversation.updatedAt = new Date();
    await this.conversationRepo.save(conversation);

    // Limpiar cache
    await this.cacheManager.del(`chat:messages:${groupId}`);
    for (const p of conversation.participants) {
      await this.cacheManager.del(`user:conversations:${p.id}`);
    }

    // Eventos
    this.eventDispatcher.dispatch({
      name: 'group.message.created',
      payload: {
        groupId,
        message: {
          id: saved.id,
          content: saved.content,
          type: saved.type,
          createdAt: saved.createdAt,
          sender: {
            id: sender.id,
            username: (sender as any).username ?? undefined,
          },
        },
      },
    });

    this.chatGateway.emitNewMessage(saved);

    return saved;
  }

  /**
   * Obtiene los grupos del usuario
   */
  async getUserGroups(userId: string) {
    const groups = await this.conversationRepo
      .createQueryBuilder('conversation')
      .innerJoin('conversation.participantsWithRoles', 'participantWithRole')
      .innerJoin('participantWithRole.user', 'user')
      .leftJoinAndSelect(
        'conversation.participantsWithRoles',
        'participantsWithRoles',
      )
      .leftJoinAndSelect('participantsWithRoles.user', 'participantUser')
      .where('conversation.type = :type', { type: ConversationType.GROUP })
      .andWhere('user.id = :userId', { userId })
      .orderBy('conversation.updatedAt', 'DESC')
      .getMany();

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

    this.eventDispatcher.dispatch({
      name: 'group.member.promoted',
      payload: { groupId, targetUserId },
    });

    return target;
  }

  async addMembersToGroup(
    groupId: string,
    requesterId: string,
    userIds: string[],
  ): Promise<{ added: string[] }> {
    if (!userIds?.length) return { added: [] };

    const requester = await this.participantRepo.findOne({
      where: { conversation: { id: groupId }, user: { id: requesterId } },
    });

    if (!requester) throw new ForbiddenException('No perteneces a este grupo');
    if (requester.role !== ConversationRole.ADMIN)
      throw new ForbiddenException('No tienes permisos para agregar miembros');

    const convo = await this.conversationRepo.findOne({
      where: { id: groupId },
    });

    if (!convo) throw new NotFoundException('Grupo no encontrado');

    const existing = await this.participantRepo.find({
      where: { conversation: { id: groupId } },
      relations: ['user'],
    });

    const existingIds = new Set(existing.map((p) => p.user.id));

    const uniqueToAdd = Array.from(new Set(userIds)).filter(
      (id) => !existingIds.has(id),
    );

    if (!uniqueToAdd.length) return { added: [] };

    const users = await this.userRepo.findByIds(uniqueToAdd);
    const rows = users.map((u) =>
      this.participantRepo.create({
        conversation: convo,
        user: u,
        role: ConversationRole.MEMBER,
      }),
    );

    await this.participantRepo.save(rows);

    this.eventDispatcher.dispatch({
      name: 'group.member.added',
      payload: { groupId, userIds: users.map((u) => u.id) },
    });

    return { added: users.map((u) => u.id) };
  }

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

    this.eventDispatcher.dispatch({
      name: 'group.member.removed',
      payload: { groupId, targetUserId },
    });
  }

  async leaveGroup(groupId: string, userId: string): Promise<void> {
    const participant = await this.participantRepo.findOne({
      where: { conversation: { id: groupId }, user: { id: userId } },
      relations: ['user'],
    });

    if (!participant) throw new NotFoundException('No perteneces a este grupo');

    await this.participantRepo.remove(participant);

    this.eventDispatcher.dispatch({
      name: 'group.member.left',
      payload: { groupId, userId },
    });
  }

  async isGroupMember(groupId: string, userId: string): Promise<boolean> {
    return this.participantRepo.exists({
      where: { conversation: { id: groupId }, user: { id: userId } },
    });
  }

  async isGroupAdmin(groupId: string, userId: string): Promise<boolean> {
    return this.participantRepo.exists({
      where: {
        conversation: { id: groupId },
        user: { id: userId },
        role: ConversationRole.ADMIN,
      },
    });
  }

  async updateGroupInfo(
    groupId: string,
    requesterId: string,
    payload: {
      name?: string;
      imageUrl?: string | null;
      description?: string | null;
    },
  ) {
    const isAdmin = await this.isGroupAdmin(groupId, requesterId);
    if (!isAdmin)
      throw new ForbiddenException('No tienes permisos para editar este grupo');

    const convo = await this.conversationRepo.findOne({
      where: { id: groupId },
    });

    if (!convo || convo.type !== ConversationType.GROUP)
      throw new NotFoundException('Grupo no encontrado');

    if (typeof payload.name === 'string') convo.name = payload.name.trim();
    if (payload.hasOwnProperty('imageUrl'))
      convo.imageUrl = payload.imageUrl ?? null;
    if (payload.hasOwnProperty('description'))
      convo.description = payload.description ?? null;

    await this.conversationRepo.save(convo);

    this.eventDispatcher.dispatch({
      name: 'group.updated',
      payload: { groupId, changes: { ...payload } },
    });

    return convo;
  }

  async deleteGroup(
    groupId: string,
    requesterId: string,
  ): Promise<{ deleted: true; groupId: string }> {
    const isAdmin = await this.isGroupAdmin(groupId, requesterId);
    if (!isAdmin)
      throw new ForbiddenException(
        'No tienes permisos para eliminar este grupo',
      );

    const convo = await this.conversationRepo.findOne({
      where: { id: groupId },
    });

    if (!convo || convo.type !== ConversationType.GROUP)
      throw new NotFoundException('Grupo no encontrado');

    // Eliminar mensajes de MongoDB
    try {
      const deleted =
        await this.messageMongoService.deleteMessagesByConversation(groupId);
      console.log(`🗑️ ${deleted} mensajes del grupo eliminados`);
    } catch (error) {
      console.error('❌ Error eliminando mensajes del grupo:', error);
    }

    await this.conversationRepo.remove(convo);

    this.eventDispatcher.dispatch({
      name: 'group.deleted',
      payload: { groupId },
    });

    return { deleted: true, groupId };
  }

  async getGroupById(groupId: string) {
    const group = await this.conversationRepo.findOne({
      where: { id: groupId, type: ConversationType.GROUP },
      relations: ['participantsWithRoles', 'participantsWithRoles.user'],
    });

    if (!group) throw new NotFoundException('Grupo no encontrado');

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      imageUrl: group.imageUrl,
      createdAt: group.createdAt,
      participants: group.participantsWithRoles.map((p) => ({
        id: p.user.id,
        name: p.user.name,
        email: p.user.email,
        profilePicture: p.user.profilePicture,
        role: p.role,
        joinedAt: p.joinedAt,
      })),
    };
  }
}
