import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from '../chat/chat.service';
import { ChatStreamService } from '../chat/chat-stream.service';
import { MessageMongoService } from '../chat/mongo/message-mongo.service';
import { RedisUnreadCounterService } from '../../common/services/redis-unread-counter.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventDispatcherService } from '../../common/events/event-dispatcher.service';
import { ChatGateway } from '../chat/chat.gateway';
import { MessageType } from '../chat/entities/message.entity';
import {
  Conversation,
  ConversationType,
} from '../chat/entities/conversation.entity';
import { User } from '../user/entities/user.entity';
import { ConversationParticipant } from '../chat/entities/conversation-participant.entity';
import { FilesRepository } from '../files/files.repository';

describe('ChatService - Redis Streams Integration', () => {
  let service: ChatService;
  let messageMongoService: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  let chatStreamService: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  let redisUnreadCounterService: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  let conversationRepo: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  let userRepo: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  let participantRepo: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  let cacheManager: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  let chatGateway: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  let eventEmitter: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  let eventDispatcher: any; // eslint-disable-line @typescript-eslint/no-explicit-any

  beforeEach(async () => {
    messageMongoService = {
      createMessage: jest.fn(),
      getMessagesPaginated: jest.fn(),
      markAsRead: jest.fn(),
      countMessages: jest.fn(),
    };

    chatStreamService = {
      addMessage: jest.fn().mockResolvedValue('streamId'),
      getMessagesPaginated: jest.fn(),
    };

    redisUnreadCounterService = {
      increment: jest.fn().mockResolvedValue(undefined),
      decrement: jest.fn().mockResolvedValue(undefined),
      batchIncrement: jest.fn().mockResolvedValue(undefined),
    };

    conversationRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    userRepo = {
      findOne: jest.fn(),
    };

    participantRepo = {
      findOne: jest.fn(),
      exists: jest.fn(),
    };

    cacheManager = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
    };

    chatGateway = {
      emitNewMessage: jest.fn(),
    };

    eventEmitter = {
      emit: jest.fn(),
    };

    eventDispatcher = {
      dispatch: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: 'ConversationRepository', useValue: conversationRepo },
        { provide: 'UserRepository', useValue: userRepo },
        {
          provide: 'ConversationParticipantRepository',
          useValue: participantRepo,
        },
        { provide: MessageMongoService, useValue: messageMongoService },
        { provide: ChatStreamService, useValue: chatStreamService },
        {
          provide: RedisUnreadCounterService,
          useValue: redisUnreadCounterService,
        },
        { provide: FilesRepository, useValue: {} },
        { provide: EventEmitter2, useValue: eventEmitter },
        { provide: EventDispatcherService, useValue: eventDispatcher },
        { provide: ChatGateway, useValue: chatGateway },
        { provide: CACHE_MANAGER, useValue: cacheManager },
      ],
    })
      .overrideProvider('ConversationRepository')
      .useValue(conversationRepo)
      .overrideProvider('UserRepository')
      .useValue(userRepo)
      .overrideProvider('ConversationParticipantRepository')
      .useValue(participantRepo)
      .compile();

    service = module.get<ChatService>(ChatService);
  });

  describe('sendMessage - Dual-Write to MongoDB and Redis', () => {
    it('should write message to MongoDB first, then Redis Streams', async () => {
      const senderId = 'sender:123';
      const receiverId = 'receiver:456';
      const conversationId = 'conv:789';

      const mockConversation = {
        id: conversationId,
        participants: [{ id: senderId }, { id: receiverId }],
        updatedAt: new Date(),
      };

      const mockSender = { id: senderId, username: 'Sender' };
      const mockSavedMessage = {
        id: 'msg:001',
        conversationId,
        senderId,
        content: 'Hello',
        type: MessageType.TEXT,
        createdAt: new Date(),
        attachments: null,
      };

      conversationRepo.findOne.mockResolvedValue(mockConversation);
      userRepo.findOne.mockResolvedValue(mockSender);
      messageMongoService.createMessage.mockResolvedValue(mockSavedMessage);
      conversationRepo.save.mockResolvedValue(mockConversation);

      const dto = { conversationId, content: 'Hello', type: MessageType.TEXT };
      const result = await service.sendMessage(senderId, dto);

      // Verify MongoDB write happened
      expect(messageMongoService.createMessage).toHaveBeenCalledWith({
        conversationId,
        senderId,
        content: 'Hello',
        type: MessageType.TEXT,
        attachments: undefined,
      });

      // Verify Redis Streams write was initiated
      expect(chatStreamService.addMessage).toHaveBeenCalledWith(
        conversationId,
        expect.objectContaining({
          id: 'msg:001',
          senderId,
          conversationId,
          content: 'Hello',
        }),
      );

      // Verify unread counter was incremented for receiver
      expect(redisUnreadCounterService.increment).toHaveBeenCalledWith(
        receiverId,
        conversationId,
      );

      // Verify response is from MongoDB (canonical source)
      expect(result).toEqual(mockSavedMessage);
    });

    it('should not block message delivery if Redis Streams write fails', async () => {
      const senderId = 'sender:123';
      const receiverId = 'receiver:456';
      const conversationId = 'conv:789';

      const mockConversation = {
        id: conversationId,
        participants: [{ id: senderId }, { id: receiverId }],
        updatedAt: new Date(),
      };

      const mockSender = { id: senderId };
      const mockSavedMessage = {
        id: 'msg:001',
        conversationId,
        senderId,
        content: 'Hello',
        type: MessageType.TEXT,
        createdAt: new Date(),
      };

      conversationRepo.findOne.mockResolvedValue(mockConversation);
      userRepo.findOne.mockResolvedValue(mockSender);
      messageMongoService.createMessage.mockResolvedValue(mockSavedMessage);
      conversationRepo.save.mockResolvedValue(mockConversation);
      chatStreamService.addMessage.mockRejectedValue(
        new Error('Redis connection failed'),
      );

      const dto = { conversationId, content: 'Hello', type: MessageType.TEXT };
      const result = await service.sendMessage(senderId, dto);

      // Message should still be delivered
      expect(result).toEqual(mockSavedMessage);
      expect(chatGateway.emitNewMessage).toHaveBeenCalled();
    });
  });

  describe('sendGroupMessage - Batch Unread Counter Updates', () => {
    it('should batch increment unread counters for all group members except sender', async () => {
      const senderId = 'sender:123';
      const groupId = 'group:789';
      const member1 = 'member:001';
      const member2 = 'member:002';

      const mockConversation = {
        id: groupId,
        participants: [{ id: senderId }, { id: member1 }, { id: member2 }],
        updatedAt: new Date(),
      };

      const mockSender = { id: senderId };
      const mockSavedMessage = {
        id: 'msg:001',
        conversationId: groupId,
        senderId,
        content: 'Group message',
        type: MessageType.TEXT,
        createdAt: new Date(),
      };

      conversationRepo.findOne.mockResolvedValue(mockConversation);
      userRepo.findOne.mockResolvedValue(mockSender);
      participantRepo.exists.mockResolvedValue(true);
      messageMongoService.createMessage.mockResolvedValue(mockSavedMessage);
      conversationRepo.save.mockResolvedValue(mockConversation);

      await service.sendGroupMessage(
        senderId,
        groupId,
        'Group message',
        MessageType.TEXT,
      );

      // Verify batch increment was called with correct members
      expect(redisUnreadCounterService.batchIncrement).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            userId: member1,
            conversationId: groupId,
            delta: 1,
          }),
          expect.objectContaining({
            userId: member2,
            conversationId: groupId,
            delta: 1,
          }),
        ]),
        'group',
      );
    });
  });

  describe('markMessageAsRead - Unread Counter Decrement', () => {
    it('should decrement unread counter when message is marked as read', async () => {
      const messageId = 'msg:001';
      const senderId = 'sender:123';
      const conversationId = 'conv:789';

      const mockUpdatedMessage = {
        id: messageId,
        senderId,
        conversationId,
        content: 'Hello',
        isRead: true,
        readAt: new Date(),
      };

      messageMongoService.markAsRead.mockResolvedValue(mockUpdatedMessage);

      await service.markMessageAsRead(messageId);

      // Verify unread counter was decremented
      expect(redisUnreadCounterService.decrement).toHaveBeenCalledWith(
        senderId,
        conversationId,
      );
    });

    it('should not decrement if markAsRead fails', async () => {
      messageMongoService.markAsRead.mockResolvedValue(null);

      await service.markMessageAsRead('msg:001');

      // Should not call decrement if message update failed
      expect(redisUnreadCounterService.decrement).not.toHaveBeenCalled();
    });
  });

  describe('getMessages - Redis Streams Fallback', () => {
    it('should attempt Redis Streams first, then fallback to MongoDB', async () => {
      const conversationId = 'conv:789';

      // Mock Redis Streams failing
      chatStreamService.getMessagesPaginated.mockRejectedValue(
        new Error('Redis unavailable'),
      );

      // Mock MongoDB success
      const mockMessages = [
        { id: 'msg:1', content: 'Hello' },
        { id: 'msg:2', content: 'World' },
      ];
      messageMongoService.countMessages.mockResolvedValue(2);
      messageMongoService.getMessagesPaginated.mockResolvedValue(mockMessages);

      const result = await service.getMessages(conversationId, 1, 20);

      // Should have tried Redis Streams first
      expect(chatStreamService.getMessagesPaginated).toHaveBeenCalledWith(
        conversationId,
        1,
        20,
      );

      // Should fallback to MongoDB
      expect(messageMongoService.getMessagesPaginated).toHaveBeenCalled();

      // Response should have MongoDB data
      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe('msg:1');
    });

    it('should use Redis Streams if available and skip MongoDB', async () => {
      const conversationId = 'conv:789';

      const mockStreamResult = {
        entries: [
          { id: 'stream:1', data: { id: 'msg:1', content: 'Cached' } },
          { id: 'stream:2', data: { id: 'msg:2', content: 'Also cached' } },
        ],
        cursor: { id: 'stream:2', isInitial: false },
        hasMore: false,
      };

      chatStreamService.getMessagesPaginated.mockResolvedValue(
        mockStreamResult,
      );

      const result = await service.getMessages(conversationId, 1, 20);

      // Should have used Redis Streams
      expect(chatStreamService.getMessagesPaginated).toHaveBeenCalled();

      // Should NOT call MongoDB since Redis Streams succeeded
      expect(messageMongoService.getMessagesPaginated).not.toHaveBeenCalled();

      // Response should have stream data
      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe('msg:1');
    });
  });

  describe('Error Scenarios', () => {
    it('should throw NotFoundException if conversation not found', async () => {
      conversationRepo.findOne.mockResolvedValue(null);

      const dto = { conversationId: 'invalid', content: 'Hello' };
      await expect(service.sendMessage('sender:123', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if sender not found', async () => {
      conversationRepo.findOne.mockResolvedValue({
        id: 'conv:789',
        participants: [],
      });
      userRepo.findOne.mockResolvedValue(null);

      const dto = { conversationId: 'conv:789', content: 'Hello' };
      await expect(service.sendMessage('unknown:user', dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
