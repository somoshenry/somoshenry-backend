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
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WebRTCService {
  private readonly logger = new Logger(WebRTCService.name);
  private readonly rooms = new Map<string, RoomEntity>();
  private redis: Redis | null = null;

  private readonly REDIS_ROOMS_KEY = 'webrtc:rooms';
  private readonly REDIS_ROOM_PREFIX = 'webrtc:room:';

  constructor(
    @Inject(forwardRef(() => RoomChatService))
    private readonly roomChatService: RoomChatService,
  ) {
    const redisUrl = process.env.REDIS_URL;

    if (redisUrl) {
      try {
        this.redis = new Redis(redisUrl, {
          maxRetriesPerRequest: 1,
          connectTimeout: 500,
          retryStrategy: (times) => {
            // Exponential backoff: 100ms, 200ms, 400ms, max 5s
            const delay = Math.min(times * 100, 5000);
            return delay;
          },
          enableReadyCheck: false,
          enableOfflineQueue: false,
        });

        this.redis.on('error', (err) => {
          this.logger.error('Redis connection error:', err);
        });

        this.redis.on('connect', () => {
          this.logger.log('Redis conectado exitosamente');
        });

        this.logger.log('WebRTC Service inicializando conexión a Redis');
      } catch (err) {
        this.logger.error('Error inicializando Redis:', err);
        this.redis = null;
      }
    } else {
      this.logger.warn(
        'REDIS_URL no configurado - modo local (sin persistencia)',
      );
    }
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
      this.logger.log(`Sala creada automáticamente: ${roomId}`);

      // Override ID for predictable rooms
      newRoom.id = roomId;
      this.rooms.set(roomId, newRoom);

      if (this.redis) await this.saveRoomToRedis(newRoom);

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

    if (this.redis) {
      await this.saveRoomToRedis(room);
    }

    this.logger.log(`Room creada: ${roomId} - ${dto.name}`);
    return room;
  }

  async getRoom(roomId: string): Promise<RoomEntity> {
    let room: RoomEntity | null = this.rooms.get(roomId) ?? null;

    if (!room && this.redis) {
      room = await this.loadRoomFromRedis(roomId);
      if (room) this.rooms.set(roomId, room);
    }

    if (!room) {
      throw new NotFoundException(`Room ${roomId} no encontrada`);
    }

    return room;
  }

  async getRooms(): Promise<RoomEntity[]> {
    if (this.redis) {
      const roomIds = await this.redis.smembers(this.REDIS_ROOMS_KEY);
      const rooms = await Promise.all(
        roomIds.map((id) => this.loadRoomFromRedis(id)),
      );
      return rooms.filter((room) => room !== null);
    }

    return Array.from(this.rooms.values()).filter((room) => room.isActive);
  }

  async deleteRoom(roomId: string): Promise<void> {
    const room = this.rooms.get(roomId);
    if (room) {
      room.isActive = false;
      this.rooms.delete(roomId);
    }

    if (this.redis) {
      await this.redis.srem(this.REDIS_ROOMS_KEY, roomId);
      await this.redis.del(`${this.REDIS_ROOM_PREFIX}${roomId}`);
    }

    // Eliminar mensajes de MongoDB
    try {
      await this.roomChatService.deleteRoomMessages(roomId);
      this.logger.log(`🗑 Mensajes de chat de room ${roomId} eliminados`);
    } catch (error) {
      this.logger.error('Error eliminando mensajes de room:', error);
    }

    this.logger.log(`🗑 Room eliminada: ${roomId}`);
  }

  async addParticipant(
    roomId: string,
    userId: string,
    socketId: string,
    audio = true,
    video = true,
  ): Promise<Participant> {
    // si la sala no existe → crearla
    await this.ensureRoomExists(roomId, userId);

    const room = await this.getRoom(roomId);

    if (room.isFull()) {
      throw new BadRequestException('La sala está llena');
    }

    if (room.hasParticipant(userId)) {
      const existing = room.getParticipant(userId);

      // refresh / reconexión → actualizar socket
      if (existing && existing.socketId !== socketId) {
        existing.socketId = socketId;
        existing.joinedAt = new Date();

        if (this.redis) await this.saveRoomToRedis(room);

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

    if (this.redis) await this.saveRoomToRedis(room);

    this.logger.log(`Participante ${userId} se unió a room ${roomId}`);
    return participant;
  }

  async removeParticipant(roomId: string, userId: string): Promise<void> {
    const room = await this.getRoom(roomId);
    room.removeParticipant(userId);

    if (room.isEmpty()) {
      setTimeout(() => this.deleteRoom(roomId), 5 * 60 * 1000);
    }

    if (this.redis) await this.saveRoomToRedis(room);

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

    if (this.redis) await this.saveRoomToRedis(room);

    return participant;
  }

  private async saveRoomToRedis(room: RoomEntity): Promise<void> {
    if (!this.redis) return;

    try {
      const roomData = {
        id: room.id,
        name: room.name,
        description: room.description || '',
        createdBy: room.createdBy,
        maxParticipants: room.maxParticipants,
        createdAt: room.createdAt.toISOString(),
        isActive: room.isActive,
        participants: JSON.stringify(Array.from(room.participants.entries())),
      };

      await Promise.all([
        this.redis.sadd(this.REDIS_ROOMS_KEY, room.id),
        this.redis.hmset(`${this.REDIS_ROOM_PREFIX}${room.id}`, roomData),
        this.redis.expire(`${this.REDIS_ROOM_PREFIX}${room.id}`, 86400),
      ]);
    } catch (error) {
      // Log but don't throw - Redis es opcional
      this.logger.warn(`Error guardando room en Redis: ${room.id}`, error);
    }
  }

  private async loadRoomFromRedis(roomId: string): Promise<RoomEntity | null> {
    if (!this.redis) return null;

    try {
      const data = await this.redis.hgetall(
        `${this.REDIS_ROOM_PREFIX}${roomId}`,
      );
      if (!data || !data.id) {
        return null;
      }

      let participants: Map<string, Participant>;
      try {
        participants = new Map<string, Participant>(
          JSON.parse(data.participants || '[]'),
        );
      } catch (parseError) {
        this.logger.warn(
          `Error parseando participantes de Redis para room ${roomId}`,
        );
        participants = new Map();
      }

      return new RoomEntity({
        id: data.id,
        name: data.name,
        description: data.description,
        createdBy: data.createdBy,
        maxParticipants: parseInt(data.maxParticipants, 10),
        createdAt: new Date(data.createdAt),
        isActive: data.isActive === 'true',
        participants,
      });
    } catch (error) {
      // Log pero no throw - Redis es opcional
      this.logger.warn(`Error cargando room desde Redis: ${roomId}`, error);
      return null;
    }
  }
}
