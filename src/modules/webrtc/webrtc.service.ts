import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { RoomEntity, Participant } from './entities/room.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomChatService } from './room-chat.service';
import { EnhancedRedisService } from '../../common/services/enhanced-redis.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WebRTCService {
  private readonly logger = new Logger(WebRTCService.name);
  private readonly rooms = new Map<string, RoomEntity>();

  private readonly REDIS_ROOMS_KEY = 'room:active';
  private readonly REDIS_ROOM_PREFIX = 'room:';

  constructor(
    @Inject(forwardRef(() => RoomChatService))
    private readonly roomChatService: RoomChatService,
    private readonly redis: EnhancedRedisService,
  ) {
    this.logger.log('WebRTC Service initialized with Enhanced Redis');
  }

  async ensureRoomExists(
    roomId: string,
    createdBy: string,
  ): Promise<RoomEntity> {
    try {
      return await this.getRoom(roomId);
    } catch {
      const dto: CreateRoomDto = {
        name: 'Live Class',
        description: '',
        maxParticipants: 50,
      };

      const newRoom = await this.createRoom(dto, createdBy);
      newRoom.id = roomId;
      this.rooms.set(roomId, newRoom);
      await this.redis.setWithDynamicTTL(
        `${this.REDIS_ROOM_PREFIX}${roomId}`,
        this.serializeRoom(newRoom),
        'room',
      );

      this.logger.log(`Sala creada automáticamente: ${roomId}`);
      return newRoom;
    }
  }

  async createRoom(dto: CreateRoomDto, createdBy: string): Promise<RoomEntity> {
    const roomId = uuidv4();

    const room = new RoomEntity({
      id: roomId,
      name: dto.name,
      description: dto.description,
      createdBy,
      maxParticipants: dto.maxParticipants || 10,
      participants: new Map<string, Participant>(),
      createdAt: new Date(),
      isActive: true,
    });

    this.rooms.set(roomId, room);
    await this.redis.setWithDynamicTTL(
      `${this.REDIS_ROOM_PREFIX}${roomId}`,
      this.serializeRoom(room),
      'room',
    );
    await this.redis.lpush(this.REDIS_ROOMS_KEY, roomId);

    this.logger.log(`Room creada: ${roomId} - ${dto.name}`);
    return room;
  }

  private hydrateRoom(room: any): RoomEntity {
    if (room instanceof RoomEntity) {
      return room;
    }

    // Convertir participants a Map
    const participants = new Map<string, Participant>();
    
    if (room.participants) {
      if (room.participants instanceof Map) {
        // Si ya es una Map, copiarla
        room.participants.forEach((p: Participant, userId: string) => {
          participants.set(userId, p);
        });
      } else if (Array.isArray(room.participants)) {
        // Si es un array de [userId, participant], convertirlo a Map
        room.participants.forEach(([userId, p]: [string, Participant]) => {
          if (userId && p && typeof p === 'object') {
            participants.set(userId, p);
          }
        });
      } else if (typeof room.participants === 'object') {
        // Si es un objeto plano (de JSON), convertirlo a Map
        Object.entries(room.participants).forEach(([userId, p]: [string, any]) => {
          if (p && typeof p === 'object') {
            participants.set(userId, p as Participant);
          }
        });
      }
    }

    return new RoomEntity({
      id: room.id,
      name: room.name,
      description: room.description,
      createdBy: room.createdBy,
      maxParticipants: room.maxParticipants || 10,
      participants,
      createdAt: room.createdAt ? new Date(room.createdAt) : new Date(),
      isActive: room.isActive !== false, // Default true
    });
  }

  private serializeRoom(room: RoomEntity): any {
    // Convertir Map a array de [key, value] para que JSON.stringify lo preserve
    return {
      id: room.id,
      name: room.name,
      description: room.description,
      createdBy: room.createdBy,
      maxParticipants: room.maxParticipants,
      participants: Array.from(room.participants.entries()), // Map → array
      createdAt: room.createdAt,
      isActive: room.isActive,
    };
  }

  async getRoom(roomId: string): Promise<RoomEntity> {
    let room = this.rooms.get(roomId);

    if (!room) {
      const cached = await this.redis.getWithFallback<any>(
        `${this.REDIS_ROOM_PREFIX}${roomId}`,
      );
      if (cached) {
        room = this.hydrateRoom(cached);
        this.rooms.set(roomId, room);
      }
    }

    if (!room) {
      throw new NotFoundException(`Room ${roomId} no encontrada`);
    }

    return room;
  }

  async getRooms(): Promise<RoomEntity[]> {
    const roomIds = await this.redis.lrange(this.REDIS_ROOMS_KEY, 0, -1);
    const rooms = await Promise.all(
      roomIds.map((id) =>
        this.redis.getWithFallback<any>(`${this.REDIS_ROOM_PREFIX}${id}`),
      ),
    );
    return rooms
      .filter((room): room is any => room !== null && room.isActive)
      .map((room) => this.hydrateRoom(room));
  }

  async deleteRoom(roomId: string): Promise<void> {
    const room = this.rooms.get(roomId);
    if (room) {
      room.isActive = false;
      this.rooms.delete(roomId);
    }

    await this.redis.del(`${this.REDIS_ROOM_PREFIX}${roomId}`);

    try {
      await this.roomChatService.deleteRoomMessages(roomId);
      this.logger.log(`Mensajes de chat de room ${roomId} eliminados`);
    } catch (error) {
      this.logger.error('Error eliminando mensajes de room:', error);
    }

    this.logger.log(`Room eliminada: ${roomId}`);
  }

  async addParticipant(
    roomId: string,
    userId: string,
    socketId: string,
    audio: boolean = true,
    video: boolean = true,
  ): Promise<Participant> {
    await this.ensureRoomExists(roomId, userId);
    const room = await this.getRoom(roomId);

    if (room.isFull()) {
      throw new BadRequestException('La sala está llena');
    }

    if (room.hasParticipant(userId)) {
      const existing = room.getParticipant(userId);

      if (existing && existing.socketId !== socketId) {
        existing.socketId = socketId;
        existing.joinedAt = new Date();
        await this.redis.setWithDynamicTTL(
          `${this.REDIS_ROOM_PREFIX}${roomId}`,
          this.serializeRoom(room),
          'room',
        );
        this.logger.log(`Usuario ${userId} reconectado en room ${roomId}`);
        return existing;
      }

      throw new BadRequestException('Ya estás en esta sala');
    }

    const participant: Participant = {
      userId,
      socketId,
      audio,
      video,
      screen: false,
      joinedAt: new Date(),
    };

    room.addParticipant(participant);
    await this.redis.setWithDynamicTTL(
      `${this.REDIS_ROOM_PREFIX}${roomId}`,
      this.serializeRoom(room),
      'room',
    );

    this.logger.log(`Participante ${userId} se unió a room ${roomId}`);
    return participant;
  }

  async removeParticipant(roomId: string, userId: string): Promise<void> {
    const room = await this.getRoom(roomId);
    room.removeParticipant(userId);

    if (room.isEmpty()) {
      setTimeout(
        () => {
          this.deleteRoom(roomId).catch((error) => {
            this.logger.error(`Error deleting empty room ${roomId}:`, error);
          });
        },
        5 * 60 * 1000,
      );
      this.logger.log(`Room ${roomId} será eliminada en 5 minutos (vacía)`);
    }

    await this.redis.setWithDynamicTTL(
      `${this.REDIS_ROOM_PREFIX}${roomId}`,
      this.serializeRoom(room),
      'room',
    );
    this.logger.log(`Participante ${userId} salió de room ${roomId}`);
  }

  async getParticipants(roomId: string): Promise<Participant[]> {
    const room = await this.getRoom(roomId);
    return room.getParticipantsList();
  }

  async updateParticipantMedia(
    roomId: string,
    userId: string,
    audio?: boolean,
    video?: boolean,
    screen?: boolean,
  ): Promise<Participant> {
    const room = await this.getRoom(roomId);
    const participant = room.getParticipant(userId);

    if (!participant) {
      throw new NotFoundException('Participante no encontrado');
    }

    if (audio !== undefined) participant.audio = audio;
    if (video !== undefined) participant.video = video;
    if (screen !== undefined) participant.screen = screen;

    await this.redis.setWithDynamicTTL(
      `${this.REDIS_ROOM_PREFIX}${roomId}`,
      this.serializeRoom(room),
      'room',
    );

    return participant;
  }
}
