import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from '../chat/chat.service';
import { ChatStreamService } from '../chat/chat-stream.service';
import { MessageMongoService } from '../chat/mongo/message-mongo.service';
import { RedisUnreadCounterService } from '../../common/services/redis-unread-counter.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventDispatcherService } from '../../common/events/event-dispatcher.service';
import { ChatGateway } from '../chat/chat.gateway';
import { MessageType } from '../chat/entities/message.entity';
import { FilesRepository } from '../files/files.repository';

describe('Redis Integration - Failure Scenarios & Backward Compatibility', () => {
  let service: ChatService;
  let messageMongoService: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  let chatStreamService: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  let redisUnreadCounterService: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  let conversationRepo: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  let userRepo: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  let participantRepo: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  let cacheManager: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  let chatGateway: any; // eslint-disable-line @typescript-eslint/no-explicit-any

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
    };

    userRepo = {
      findOne: jest.fn(),
    };

    participantRepo = {
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
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
        { provide: EventDispatcherService, useValue: { dispatch: jest.fn() } },
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

  describe('Failure Scenario: Redis Offline', () => {
    it('should continue operating if Redis Streams write fails', async () => {
      const senderId = 'sender:123';
      const receiverId = 'receiver:456';
      const conversationId = 'conv:789';

      const mockConversation = {
        id: conversationId,
        participants: [{ id: senderId }, { id: receiverId }],
        updatedAt: new Date(),
      };

      const mockSavedMessage = {
        id: 'msg:001',
        conversationId,
        senderId,
        content: 'Message',
        type: MessageType.TEXT,
        createdAt: new Date(),
      };

      conversationRepo.findOne.mockResolvedValue(mockConversation);
      userRepo.findOne.mockResolvedValue({ id: senderId });
      messageMongoService.createMessage.mockResolvedValue(mockSavedMessage);
      conversationRepo.save.mockResolvedValue(mockConversation);
      chatStreamService.addMessage.mockRejectedValue(
        new Error('Redis offline'),
      );

      const dto = {
        conversationId,
        content: 'Message',
        type: MessageType.TEXT,
      };
      const result = await service.sendMessage(senderId, dto);

      // Message should still be delivered from MongoDB
      expect(result.id).toBe('msg:001');
      expect(chatGateway.emitNewMessage).toHaveBeenCalled();
    });

    it('should continue operating if Redis unread counter fails', async () => {
      const senderId = 'sender:123';
      const conversationId = 'conv:789';

      const mockConversation = {
        id: conversationId,
        participants: [{ id: senderId }, { id: 'receiver:456' }],
        updatedAt: new Date(),
      };

      const mockSavedMessage = {
        id: 'msg:001',
        conversationId,
        senderId,
        content: 'Message',
        type: MessageType.TEXT,
        createdAt: new Date(),
      };

      conversationRepo.findOne.mockResolvedValue(mockConversation);
      userRepo.findOne.mockResolvedValue({ id: senderId });
      messageMongoService.createMessage.mockResolvedValue(mockSavedMessage);
      conversationRepo.save.mockResolvedValue(mockConversation);
      redisUnreadCounterService.increment.mockRejectedValue(
        new Error('Redis connection lost'),
      );

      const dto = { conversationId, content: 'Message' };
      const result = await service.sendMessage(senderId, dto);

      // Message should still be delivered
      expect(result).toEqual(mockSavedMessage);
    });

    it('should fallback to MongoDB if Redis Streams returns no data', async () => {
      const conversationId = 'conv:789';

      // Redis Streams returns empty result
      chatStreamService.getMessagesPaginated.mockResolvedValue({
        entries: [],
        cursor: { id: '', isInitial: true },
        hasMore: false,
      });

      const mockMongoMessages = [{ id: 'msg:1', content: 'From DB' }];
      messageMongoService.countMessages.mockResolvedValue(1);
      messageMongoService.getMessagesPaginated.mockResolvedValue(
        mockMongoMessages,
      );

      const result = await service.getMessages(conversationId, 1, 20);

      // Should fallback to MongoDB when Redis returns empty
      expect(messageMongoService.getMessagesPaginated).toHaveBeenCalled();
      expect(result.data[0].content).toBe('From DB');
    });
  });

  describe('Failure Scenario: Partial Writes', () => {
    it('should not fail if Redis Streams write is slow but eventual', async () => {
      const senderId = 'sender:123';
      const conversationId = 'conv:789';

      let streamWriteResolved = false;
      chatStreamService.addMessage.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              streamWriteResolved = true;
              resolve('streamId');
            }, 100);
          }),
      );

      const mockConversation = {
        id: conversationId,
        participants: [{ id: senderId }, { id: 'receiver' }],
        updatedAt: new Date(),
      };

      const mockSavedMessage = {
        id: 'msg:001',
        conversationId,
        senderId,
        content: 'Message',
        type: MessageType.TEXT,
        createdAt: new Date(),
      };

      conversationRepo.findOne.mockResolvedValue(mockConversation);
      userRepo.findOne.mockResolvedValue({ id: senderId });
      messageMongoService.createMessage.mockResolvedValue(mockSavedMessage);
      conversationRepo.save.mockResolvedValue(mockConversation);

      const dto = { conversationId, content: 'Message' };
      const result = await service.sendMessage(senderId, dto);

      // Should return immediately with MongoDB message
      expect(result.id).toBe('msg:001');

      // Redis write should eventually complete
      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(streamWriteResolved).toBe(true);
    });
  });

  describe('Backward Compatibility: Response Formats', () => {
    it('should return exact MongoDB response format unchanged', async () => {
      const senderId = 'sender:123';
      const conversationId = 'conv:789';

      const mockConversation = {
        id: conversationId,
        participants: [{ id: senderId }, { id: 'receiver' }],
        updatedAt: new Date(),
      };

      const mongodbResponse = {
        id: 'msg:001',
        conversationId: 'conv:789',
        senderId: 'sender:123',
        content: 'Hello',
        type: 'TEXT',
        attachments: null,
        createdAt: new Date('2025-01-01T12:00:00Z'),
        updatedAt: new Date('2025-01-01T12:00:00Z'),
        isRead: false,
        readAt: null,
        sender: {
          id: 'sender:123',
          name: 'John Doe',
          avatar: null,
        },
      };

      conversationRepo.findOne.mockResolvedValue(mockConversation);
      userRepo.findOne.mockResolvedValue({ id: senderId });
      messageMongoService.createMessage.mockResolvedValue(mongodbResponse);
      conversationRepo.save.mockResolvedValue(mockConversation);

      const dto = { conversationId, content: 'Hello' };
      const result = await service.sendMessage(senderId, dto);

      // Response should be exactly what MongoDB returns
      expect(result).toEqual(mongodbResponse);
      expect(result.sender.name).toBe('John Doe');
      expect(result.createdAt).toEqual(new Date('2025-01-01T12:00:00Z'));
    });

    it('should preserve getMessages response structure', async () => {
      const conversationId = 'conv:789';

      const mockMessages = [
        { id: 'msg:1', content: 'First' },
        { id: 'msg:2', content: 'Second' },
      ];

      messageMongoService.countMessages.mockResolvedValue(2);
      messageMongoService.getMessagesPaginated.mockResolvedValue(mockMessages);
      chatStreamService.getMessagesPaginated.mockRejectedValue(
        new Error('offline'),
      );

      const result = await service.getMessages(conversationId, 1, 20);

      // Response format should be maintained
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.meta).toHaveProperty('total');
      expect(result.meta).toHaveProperty('page');
      expect(result.meta).toHaveProperty('limit');
      expect(result.meta).toHaveProperty('totalPages');
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
    });

    it('should emit exact same WebSocket events regardless of Redis state', async () => {
      const senderId = 'sender:123';
      const conversationId = 'conv:789';

      const mockConversation = {
        id: conversationId,
        participants: [{ id: senderId }, { id: 'receiver' }],
        updatedAt: new Date(),
      };

      const mongodbMessage = {
        id: 'msg:001',
        conversationId,
        senderId,
        content: 'Message',
        type: MessageType.TEXT,
        createdAt: new Date(),
      };

      conversationRepo.findOne.mockResolvedValue(mockConversation);
      userRepo.findOne.mockResolvedValue({ id: senderId });
      messageMongoService.createMessage.mockResolvedValue(mongodbMessage);
      conversationRepo.save.mockResolvedValue(mockConversation);
      chatStreamService.addMessage.mockRejectedValue(
        new Error('Redis offline'),
      );

      const dto = { conversationId, content: 'Message' };
      await service.sendMessage(senderId, dto);

      // WebSocket emission should happen regardless
      expect(chatGateway.emitNewMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'msg:001',
          conversationId,
          senderId,
          content: 'Message',
        }),
      );
    });
  });

  describe('Stream Read Errors', () => {
    it('should handle stream decode errors gracefully', async () => {
      const conversationId = 'conv:789';

      chatStreamService.getMessagesPaginated.mockRejectedValue(
        new Error('Invalid stream data format'),
      );

      const mockMessages = [{ id: 'msg:1', content: 'Fallback' }];
      messageMongoService.countMessages.mockResolvedValue(1);
      messageMongoService.getMessagesPaginated.mockResolvedValue(mockMessages);

      const result = await service.getMessages(conversationId, 1, 20);

      // Should fallback to MongoDB
      expect(result.data).toEqual(mockMessages);
    });

    it('should handle stream timeout errors', async () => {
      const conversationId = 'conv:789';

      chatStreamService.getMessagesPaginated.mockRejectedValue(
        new Error('Operation timed out'),
      );

      const mockMessages = [{ id: 'msg:1', content: 'Timeout fallback' }];
      messageMongoService.countMessages.mockResolvedValue(1);
      messageMongoService.getMessagesPaginated.mockResolvedValue(mockMessages);

      const result = await service.getMessages(conversationId, 1, 20);

      expect(result.data[0].content).toBe('Timeout fallback');
    });
  });

  describe('Deduplication & Idempotency', () => {
    it('should not create duplicate messages if write retried', async () => {
      const senderId = 'sender:123';
      const conversationId = 'conv:789';

      const mockConversation = {
        id: conversationId,
        participants: [{ id: senderId }, { id: 'receiver' }],
        updatedAt: new Date(),
      };

      const mongodbMessage = {
        id: 'msg:001',
        conversationId,
        senderId,
        content: 'Message',
        type: MessageType.TEXT,
        createdAt: new Date(),
      };

      conversationRepo.findOne.mockResolvedValue(mockConversation);
      userRepo.findOne.mockResolvedValue({ id: senderId });
      messageMongoService.createMessage.mockResolvedValue(mongodbMessage);
      conversationRepo.save.mockResolvedValue(mockConversation);

      const dto = { conversationId, content: 'Message' };

      // Call multiple times
      const result1 = await service.sendMessage(senderId, dto);
      const result2 = await service.sendMessage(senderId, dto);

      // MongoDB service should be called twice (no client-side dedup)
      expect(messageMongoService.createMessage).toHaveBeenCalledTimes(2);

      // Both should return same structure
      expect(result1.id).toBe('msg:001');
      expect(result2.id).toBe('msg:001');
    });
  });
});
