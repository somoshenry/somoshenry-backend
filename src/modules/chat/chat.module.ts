import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';

// Controllers & Services
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatStreamService } from './chat-stream.service';
import { ChatPubSubService } from './chat-pubsub.service';

// PostgreSQL Entities (solo las necesarias)
import { Conversation } from './entities/conversation.entity';
import { ConversationParticipant } from './entities/conversation-participant.entity';
import { User } from '../user/entities/user.entity';

// MongoDB
import { MessageMongo, MessageMongoSchema } from './mongo/message-mongo.schema';
import { MessageMongoService } from './mongo/message-mongo.service';

// Auth & Files
import { AuthModule } from '../auth/auth.module';
import { FilesRepository } from '../files/files.repository';

// Events & Guards
import { EventDispatcherService } from '../../common/events/event-dispatcher.service';
import { GroupMemberGuard } from './guards/group-member.guard';
import { GroupAdminGuard } from './guards/group-admin.guard';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, ConversationParticipant, User]),

    MongooseModule.forFeature([
      { name: MessageMongo.name, schema: MessageMongoSchema },
    ]),

    forwardRef(() => AuthModule),
    CommonModule,
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
    ChatGateway,
    ChatStreamService,
    ChatPubSubService,
    MessageMongoService,

    EventDispatcherService,
    FilesRepository,

    GroupMemberGuard,
    GroupAdminGuard,
  ],
  exports: [ChatService, ChatGateway, ChatStreamService, ChatPubSubService],
})
export class ChatModule {}
