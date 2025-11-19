import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { WebRTCService } from './webrtc.service';
import { RoomChatService } from './room-chat.service';
import { IceServerManagerService } from './services/ice-server-manager.service';
import { RedisMetricsService } from '../../common/services/redis-metrics.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';

interface RequestWithUser {
  user: {
    id?: string;
    sub?: string;
    userId?: string;
  };
}

@Controller('webrtc')
@UseGuards(JwtAuthGuard)
export class WebRTCController {
  constructor(
    private readonly webrtcService: WebRTCService,
    private readonly roomChatService: RoomChatService,
    private readonly iceServerManager: IceServerManagerService,
    private readonly redisMetrics: RedisMetricsService,
  ) {}

  @Post('rooms')
  async createRoom(
    @Body() dto: CreateRoomDto,
    @Request() req: RequestWithUser,
  ) {
    const userId = req.user.id || req.user.sub || req.user.userId;
    if (!userId) throw new BadRequestException('User ID not found');

    const room = await this.webrtcService.createRoom(dto, userId);

    return {
      id: room.id,
      name: room.name,
      description: room.description,
      maxParticipants: room.maxParticipants,
      createdBy: room.createdBy,
      createdAt: room.createdAt,
      participantsCount: room.participants.size,
    };
  }

  @Get('rooms')
  async getRooms() {
    const rooms = await this.webrtcService.getRooms();

    return rooms.map((room) => ({
      id: room.id,
      name: room.name,
      description: room.description,
      maxParticipants: room.maxParticipants,
      createdBy: room.createdBy,
      createdAt: room.createdAt,
      participantsCount: room.participants.size,
      currentParticipants: room.participants.size,
      isFull: room.isFull(),
    }));
  }

  @Get('rooms/:id')
  async getRoom(@Param('id') id: string) {
    const room = await this.webrtcService.getRoom(id);
    const participants = room.getParticipantsList();

    return {
      id: room.id,
      name: room.name,
      description: room.description,
      maxParticipants: room.maxParticipants,
      createdBy: room.createdBy,
      createdAt: room.createdAt,
      participants: participants.map((p) => ({
        userId: p.userId,
        audio: p.audio,
        video: p.video,
        screen: p.screen,
        joinedAt: p.joinedAt,
      })),
      participantsCount: participants.length,
      isFull: room.isFull(),
    };
  }

  @Delete('rooms/:id')
  async deleteRoom(@Param('id') id: string, @Request() req: RequestWithUser) {
    const userId = req.user.id || req.user.sub || req.user.userId;
    if (!userId) throw new BadRequestException('User ID not found');

    const room = await this.webrtcService.getRoom(id);

    if (room.createdBy !== userId) {
      return { message: 'No tienes permisos para eliminar esta sala' };
    }

    await this.webrtcService.deleteRoom(id);
    return { message: 'Sala eliminada exitosamente' };
  }

  @Get('rooms/:id/participants')
  async getRoomParticipants(@Param('id') id: string) {
    const participants = await this.webrtcService.getParticipants(id);

    return participants.map((p) => ({
      userId: p.userId,
      audio: p.audio,
      video: p.video,
      screen: p.screen,
      joinedAt: p.joinedAt,
    }));
  }

  @Get('ice-servers')
  getIceServers() {
    const iceServersConfig = this.iceServerManager.getIceServersConfig();
    return iceServersConfig;
  }

  @Get('rooms/:id/chat')
  async getRoomChatMessages(
    @Param('id') roomId: string,
    @Query('limit') limit?: string,
  ) {
    let msgLimit = 50;
    if (limit) {
      const parsed = parseInt(limit, 10);
      if (!isNaN(parsed) && parsed > 0 && parsed <= 1000) {
        msgLimit = parsed;
      }
    }
    const messages = await this.roomChatService.getMessages(roomId, msgLimit);

    return {
      roomId,
      messages,
      count: messages.length,
    };
  }

  @Get('health')
  getHealth() {
    const metrics = this.redisMetrics.getFormattedMetrics();
    return {
      status: 'ok',
      service: 'WebRTC',
      timestamp: new Date().toISOString(),
      redis: metrics,
    };
  }
}
