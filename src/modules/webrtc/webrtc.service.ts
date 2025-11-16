import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { RoomEntity, Participant } from './entities/room.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WebRTCService {
  private readonly logger = new Logger(WebRTCService.name);
  private readonly rooms = new Map<string, RoomEntity>();
  private redis: Redis | null = null;

  private readonly REDIS_ROOMS_KEY = 'webrtc:rooms';
  private readonly REDIS_ROOM_PREFIX = 'webrtc:room:';

  constructor() {
    const redisUrl = process.env.REDIS_URL;

    if (redisUrl) {
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        connectTimeout: 500,
      });
      this.logger.log('✅ WebRTC Service conectado a Redis');
    } else {
      this.logger.warn('⚠️ WebRTC Service sin Redis (modo local)');
    }
  }

  // ==========================
  //   CRUD DE ROOMS
  // ==========================

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

    this.logger.log(`🎥 Room creada: ${roomId} - ${dto.name}`);
    return room;
  }

  async getRoom(roomId: string): Promise<RoomEntity> {
    let room: RoomEntity | null = this.rooms.get(roomId) ?? null;

    // Si no está en memoria, buscar en Redis
    if (!room && this.redis) {
      room = await this.loadRoomFromRedis(roomId);
      if (room) {
        this.rooms.set(roomId, room);
      }
    }

    if (!room) {
      throw new NotFoundException(`Room ${roomId} no encontrada`);
    }

    return room;
  }

  async getRooms(): Promise<RoomEntity[]> {
    // Usar Redis si está disponible
    if (this.redis) {
      const roomIds = await this.redis.smembers(this.REDIS_ROOMS_KEY);
      const rooms = await Promise.all(
        roomIds.map((id) => this.loadRoomFromRedis(id)),
      );
      return rooms.filter((room) => room !== null) as RoomEntity[];
    }

    // Local memory fallback
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

    this.logger.log(`🗑️ Room eliminada: ${roomId}`);
  }

  // ==========================
  //     PARTICIPANTES
  // ==========================

  async addParticipant(
    roomId: string,
    userId: string,
    socketId: string,
    audio = true,
    video = true,
  ): Promise<Participant> {
    const room = await this.getRoom(roomId);

    if (room.isFull()) {
      throw new BadRequestException('La sala está llena');
    }

    if (room.hasParticipant(userId)) {
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

    if (this.redis) {
      await this.saveRoomToRedis(room);
    }

    this.logger.log(`➕ Participante ${userId} se unió a room ${roomId}`);
    return participant;
  }

  async removeParticipant(roomId: string, userId: string): Promise<void> {
    const room = await this.getRoom(roomId);
    room.removeParticipant(userId);

    // Eliminar sala si queda vacía después de 5 minutos
    if (room.isEmpty()) {
      setTimeout(() => this.deleteRoom(roomId), 5 * 60 * 1000);
    }

    if (this.redis) {
      await this.saveRoomToRedis(room);
    }

    this.logger.log(`➖ Participante ${userId} salió de room ${roomId}`);
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

    if (this.redis) {
      await this.saveRoomToRedis(room);
    }

    return participant;
  }

  // ==========================
  //        REDIS
  // ==========================

  private async saveRoomToRedis(room: RoomEntity): Promise<void> {
    if (!this.redis) return;

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

    await this.redis.sadd(this.REDIS_ROOMS_KEY, room.id);
    await this.redis.hmset(`${this.REDIS_ROOM_PREFIX}${room.id}`, roomData);
    await this.redis.expire(`${this.REDIS_ROOM_PREFIX}${room.id}`, 86400);
  }

  private async loadRoomFromRedis(roomId: string): Promise<RoomEntity | null> {
    if (!this.redis) return null;

    const data = await this.redis.hgetall(`${this.REDIS_ROOM_PREFIX}${roomId}`);
    if (!data || !data.id) return null;

    // Map<string, Participant>
    const participants = new Map<string, Participant>(
      JSON.parse(data.participants || '[]'),
    );

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
  }
}
