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
  Inject,
} from '@nestjs/common';
import { WebRTCService } from './webrtc.service';
import { RoomChatService } from './room-chat.service';
import { IceServerManagerService } from './services/ice-server-manager.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';

@Controller('webrtc')
@UseGuards(JwtAuthGuard)
export class WebRTCController {
  constructor(
    private readonly webrtcService: WebRTCService,
    private readonly roomChatService: RoomChatService,
    private readonly iceServerManager: IceServerManagerService,
  ) {}

  @Post('rooms')
  async createRoom(@Body() dto: CreateRoomDto, @Request() req: any) {
    const userId = req.user?.id || req.user?.sub || req.user?.userId;
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
  async deleteRoom(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id || req.user?.sub || req.user?.userId;
    const room = await this.webrtcService.getRoom(id);

    // Solo el creador puede eliminar la sala
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
  async getIceServers() {
    const iceServersConfig = await this.iceServerManager.getIceServersConfig();
    return iceServersConfig;
  }

  @Get('rooms/:id/chat')
  async getRoomChatMessages(
    @Param('id') roomId: string,
    @Query('limit') limit?: string,
  ) {
    const msgLimit = limit ? parseInt(limit, 10) : 50;
    const messages = await this.roomChatService.getMessages(roomId, msgLimit);

    return {
      roomId,
      messages,
      count: messages.length,
    };
  }

  // Health check específico de WebRTC
  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      service: 'WebRTC',
      timestamp: new Date().toISOString(),
    };
  }
}
