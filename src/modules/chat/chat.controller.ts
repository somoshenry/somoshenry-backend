import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { AuthProtected } from '../auth/decorator/auth-protected.decorator';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

// Swagger docs
import { OpenConversationDocs } from './docs/open-conversation.swagger';
import { GetConversationsDocs } from './docs/get-conversations.swagger';
import { GetMessagesDocs } from './docs/get-messages.swagger';
import { SendMessageDocs } from './docs/send-message.swagger';
import { MarkAsReadDocs } from './docs/mark-read.swagger';
import { UploadMediaDocs } from './docs/upload-media.swagger';
import { CreateMessageDto } from './dto/create-message.dto';
import { Delete } from '@nestjs/common';
import { DeleteConversationResponseDto } from './dto/delete-conversation-response.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  @AuthProtected()
  @OpenConversationDocs()
  openConversation(
    @Req() req: Request & { user: { id: string } },
    @Body('peerUserId') peerUserId: string,
  ) {
    return this.chatService.openConversation(req.user.id, peerUserId);
  }

  @Get('conversations')
  @AuthProtected()
  @GetConversationsDocs()
  getConversations(@Req() req: Request & { user: { id: string } }) {
    return this.chatService.getUserConversations(req.user.id);
  }

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

  @Post('messages')
  @AuthProtected()
  @SendMessageDocs()
  sendMessage(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: CreateMessageDto,
  ) {
    return this.chatService.sendMessage(req.user.id, dto);
  }

  @Patch('messages/:id/read')
  @AuthProtected()
  @MarkAsReadDocs()
  markAsRead(@Param('id') id: string) {
    return this.chatService.markMessageAsRead(id);
  }

  @Post('upload')
  @AuthProtected()
  @UploadMediaDocs()
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.chatService.uploadMedia(file);
  }

  @Delete('conversations/:conversationId')
  @AuthProtected()
  async deleteConversation(
    @Req() req: Request & { user: { id: string } },
    @Param('conversationId') conversationId: string,
  ): Promise<DeleteConversationResponseDto> {
    return this.chatService.deleteConversation(conversationId, req.user.id);
  }
}
