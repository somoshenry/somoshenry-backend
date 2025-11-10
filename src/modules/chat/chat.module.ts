import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { MessageAttachment } from './entities/message-attachment.entity';
import { User } from '../user/entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { EventDispatcherService } from '../../common/events/event-dispatcher.service';
import { FilesRepository } from '../files/files.repository';
import { ConversationParticipant } from './entities/conversation-participant.entity';
import { GroupMemberGuard } from './guards/group-member.guard';
import { GroupAdminGuard } from './guards/group-admin.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Conversation,
      Message,
      MessageAttachment,
      User,
      ConversationParticipant,
    ]),
    forwardRef(() => AuthModule),
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
    ChatGateway,
    EventDispatcherService,
    FilesRepository,
    GroupMemberGuard,
    GroupAdminGuard,
  ],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}
