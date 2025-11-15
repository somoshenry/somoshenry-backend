import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';

// Controllers & Services
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';

// PostgreSQL Entities (solo las necesarias)
import { Conversation } from './entities/conversation.entity';
import { ConversationParticipant } from './entities/conversation-participant.entity';
import { User } from '../user/entities/user.entity';
// NOTA: Message y MessageAttachment ya NO se usan (solo MongoDB)

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

@Module({
  imports: [
    // PostgreSQL - Solo conversaciones y participantes
    TypeOrmModule.forFeature([
      Conversation,
      ConversationParticipant,
      User,
      // ❌ YA NO: Message, MessageAttachment (ahora en MongoDB)
    ]),

    // MongoDB - Mensajes
    MongooseModule.forFeature([
      { name: MessageMongo.name, schema: MessageMongoSchema },
    ]),

    // Módulos externos
    forwardRef(() => AuthModule),
  ],
  controllers: [ChatController],
  providers: [
    // Core services
    ChatService,
    ChatGateway,
    MessageMongoService,

    // Utilities
    EventDispatcherService,
    FilesRepository,

    // Guards
    GroupMemberGuard,
    GroupAdminGuard,
  ],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}
