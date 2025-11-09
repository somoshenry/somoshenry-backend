import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  // UploadedFile,
  UseInterceptors,
  UploadedFiles,
  Delete,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { AuthProtected } from '../auth/decorator/auth-protected.decorator';
import { Request } from 'express';
// import { FileInterceptor } from '@nestjs/platform-express';

// Swagger docs
import { OpenConversationDocs } from './docs/open-conversation.swagger';
import { GetConversationsDocs } from './docs/get-conversations.swagger';
import { GetMessagesDocs } from './docs/get-messages.swagger';
import { SendMessageDocs } from './docs/send-message.swagger';
import { MarkAsReadDocs } from './docs/mark-read.swagger';
// import { UploadMediaDocs } from './docs/upload-media.swagger';

import { CreateMessageDto } from './dto/create-message.dto';
import { DeleteConversationResponseDto } from './dto/delete-conversation-response.dto';
import { EmitEvent } from 'src/common/events/decorators/emit-event.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';
import { SendMessageWithFilesDto } from './dto/send-message-with-files.dto';

import { CreateGroupDto } from './dto/create-group.dto';
import { SendGroupMessageDocs } from './docs/send-group-message.swagger';
import { SendGroupMessageDto } from './dto/send-group-message.dto';
import { AddMembersDocs } from './docs/add-members.swagger';
import {
  PromoteMemberDocs,
  RemoveMemberDocs,
  LeaveGroupDocs,
} from './docs/group-management.swagger';

import { UseGuards } from '@nestjs/common';
import { GroupAdminGuard } from './guards/group-admin.guard';
import { GroupMemberGuard } from './guards/group-member.guard';
import { UpdateGroupDto } from './dto/update-group.dto';
import { CreateGroupDocs } from './docs/create-group.swagger';
import { GetUserGroupsDocs } from './docs/get-user-groups.swagger';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // Crear conversacion

  @Post('conversations')
  @AuthProtected()
  @OpenConversationDocs()
  openConversation(
    @Req() req: Request & { user: { id: string } },
    @Body('peerUserId') peerUserId: string,
  ) {
    return this.chatService.openConversation(req.user.id, peerUserId);
  }

  // Obtener conversacion

  @Get('conversations')
  @AuthProtected()
  @GetConversationsDocs()
  getConversations(@Req() req: Request & { user: { id: string } }) {
    return this.chatService.getUserConversations(req.user.id);
  }

  // Obtener mensajes

  @Get('conversations/:conversationId/messages')
  @AuthProtected()
  @GetMessagesDocs()
  getMessages(
    @Param('conversationId') conversationId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.chatService.getMessages(
      conversationId,
      Number(page),
      Number(limit),
    );
  }

  // Mandar mensajes

  @Post('messages')
  @AuthProtected()
  @EmitEvent('message.created')
  @SendMessageDocs()
  sendMessage(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: CreateMessageDto,
  ) {
    return this.chatService.sendMessage(req.user.id, dto);
  }

  // Marcar leido

  @Patch('messages/:id/read')
  @AuthProtected()
  @MarkAsReadDocs()
  markAsRead(@Param('id') id: string) {
    return this.chatService.markMessageAsRead(id);
  }

  // Mandar file
  @Post('messages/files')
  @AuthProtected()
  @UseInterceptors(FilesInterceptor('files'))
  async sendMessageWithFiles(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: SendMessageWithFilesDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.chatService.sendMessageWithFiles(req.user.id, dto, files);
  }

  //Borrar conversacion

  @Delete('conversations/:conversationId')
  @AuthProtected()
  async deleteConversation(
    @Req() req: Request & { user: { id: string } },
    @Param('conversationId') conversationId: string,
  ): Promise<DeleteConversationResponseDto> {
    return this.chatService.deleteConversation(conversationId, req.user.id);
  }

  // Crear grupo

  @Post('groups')
  @AuthProtected()
  @CreateGroupDocs()
  async createGroup(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: CreateGroupDto,
  ) {
    return this.chatService.createGroup(req.user.id, dto);
  }

  // Mandar mensaje grupo

  @Post('groups/:groupId/messages')
  @AuthProtected()
  @SendGroupMessageDocs()
  async sendGroupMessage(
    @Req() req: Request & { user: { id: string } },
    @Param('groupId') groupId: string,
    @Body() dto: SendGroupMessageDto,
  ) {
    return this.chatService.sendGroupMessage(
      req.user.id,
      groupId,
      dto.content,
      dto.type,
    );
  }

  // Obtener grupo

  @Get('groups')
  @AuthProtected()
  @GetUserGroupsDocs()
  async getUserGroups(@Req() req: Request & { user: { id: string } }) {
    return this.chatService.getUserGroups(req.user.id);
  }

  // Promover un miembro a Admin

  @Patch('groups/:groupId/members/:userId/promote')
  @AuthProtected()
  @UseGuards(GroupAdminGuard)
  @PromoteMemberDocs()
  async promoteMemberToAdmin(
    @Req() req: Request & { user: { id: string } },
    @Param('groupId') groupId: string,
    @Param('userId') userId: string,
  ) {
    return this.chatService.promoteMemberToAdmin(groupId, req.user.id, userId);
  }

  // Elimina un miembro del grupo solo admin
  @Delete('groups/:groupId/members/:userId')
  @AuthProtected()
  @UseGuards(GroupAdminGuard)
  @RemoveMemberDocs()
  async removeMemberFromGroup(
    @Req() req: Request & { user: { id: string } },
    @Param('groupId') groupId: string,
    @Param('userId') userId: string,
  ) {
    return this.chatService.removeMemberFromGroup(groupId, req.user.id, userId);
  }

  // Permite que el usuario autenticado abandone el grupo.

  @LeaveGroupDocs()
  @Post('groups/:groupId/leave')
  @AuthProtected()
  @LeaveGroupDocs()
  @UseGuards(GroupMemberGuard)
  leave(
    @Req() req: Request & { user: { id: string } },
    @Param('groupId') groupId: string,
  ) {
    return this.chatService.leaveGroup(groupId, req.user.id);
  }

  // Sacar miembro del grupo

  @Delete('groups/:groupId/members/:userId')
  @AuthProtected()
  @UseGuards(GroupAdminGuard)
  removeMember(
    @Req() req: Request & { user: { id: string } },
    @Param('groupId') groupId: string,
    @Param('userId') userId: string,
  ) {
    return this.chatService.removeMemberFromGroup(groupId, req.user.id, userId);
  }

  // Agregar miembro a grupo

  @AddMembersDocs()
  @Post('groups/:groupId/members')
  @AuthProtected()
  @UseGuards(GroupAdminGuard)
  addMembers(
    @Req() req: Request & { user: { id: string } },
    @Param('groupId') groupId: string,
    @Body('userIds') userIds: string[],
  ) {
    return this.chatService.addMembersToGroup(groupId, req.user.id, userIds);
  }

  // Modificar informacion del grupo

  @Patch('groups/:groupId')
  @AuthProtected()
  @UseGuards(GroupAdminGuard)
  updateGroup(
    @Req() req: Request & { user: { id: string } },
    @Param('groupId') groupId: string,
    @Body() dto: UpdateGroupDto,
  ) {
    return this.chatService.updateGroupInfo(groupId, req.user.id, dto);
  }

  // Borrar grupo

  @Delete('groups/:groupId')
  @AuthProtected()
  @UseGuards(GroupAdminGuard)
  deleteGroup(
    @Req() req: Request & { user: { id: string } },
    @Param('groupId') groupId: string,
  ) {
    return this.chatService.deleteGroup(groupId, req.user.id);
  }
}
