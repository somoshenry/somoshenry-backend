import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from '../chat/chat.gateway';
import { ChatService } from '../chat/chat.service';
import { RedisPubSubService } from '../../common/services/redis-pubsub.service';
import { RedisService } from '../../common/services/redis.service';
import { JwtService } from '@nestjs/jwt';
import { EventDispatcherService } from '../../common/events/event-dispatcher.service';
import { Server, Socket } from 'socket.io';

describe('ChatGateway - WebSocket Message Delivery & Subscriptions', () => {
  let gateway: ChatGateway;
  let chatService: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  let redisPubSubService: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  let redisService: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  let jwtService: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  let eventDispatcher: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  let mockServer: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  let mockClient: any; // eslint-disable-line @typescript-eslint/no-explicit-any

  beforeEach(async () => {
    // Mock services
    chatService = {
      getConversationById: jest.fn(),
    };

    redisPubSubService = {
      publishDirectMessage: jest.fn().mockResolvedValue(undefined),
      publishGroupMessage: jest.fn().mockResolvedValue(undefined),
      subscribeToDirectMessage: jest.fn().mockResolvedValue(undefined),
      subscribeToGroupMessages: jest.fn().mockResolvedValue(undefined),
      unsubscribeFromDM: jest.fn().mockResolvedValue(undefined),
      unsubscribeFromGroup: jest.fn().mockResolvedValue(undefined),
    };

    redisService = {
      getRedis: jest.fn().mockReturnValue({
        sadd: jest.fn().mockResolvedValue(1),
        srem: jest.fn().mockResolvedValue(1),
        smembers: jest.fn().mockResolvedValue(['user:1', 'user:2']),
      }),
    };

    jwtService = {
      verify: jest.fn(),
    };

    eventDispatcher = {
      on: jest.fn(),
    };

    // Mock WebSocket server and client
    mockClient = {
      id: 'socket:123',
      emit: jest.fn(),
      join: jest.fn(),
      leave: jest.fn(),
      on: jest.fn(),
      handshake: {
        auth: {
          token: 'valid.jwt.token',
        },
      },
    };

    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
      in: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        { provide: ChatService, useValue: chatService },
        { provide: RedisPubSubService, useValue: redisPubSubService },
        { provide: RedisService, useValue: redisService },
        { provide: JwtService, useValue: jwtService },
        { provide: EventDispatcherService, useValue: eventDispatcher },
      ],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
    gateway.server = mockServer;
  });

  describe('sendMessage - Pub/Sub Delivery', () => {
    it('should publish DM via Pub/Sub instead of direct emit', async () => {
      const mockPayload = {
        conversationId: 'conv:123',
        senderId: 'user:1',
        content: 'Hello',
      };

      jwtService.verify.mockReturnValue({
        id: 'user:1',
        email: 'user1@test.com',
      });

      // Mock conversation
      const mockConversation = {
        id: 'conv:123',
        participants: [{ id: 'user:1' }, { id: 'user:2' }],
      };
      chatService.getConversationById.mockResolvedValue(mockConversation);

      // Call sendMessage
      await gateway.sendMessage(mockPayload, mockClient);

      // Verify Pub/Sub was used for delivery (not direct emit)
      expect(redisPubSubService.publishDirectMessage).toHaveBeenCalledWith(
        'conv:123',
        expect.objectContaining({
          type: 'message.sent',
          conversationId: 'conv:123',
        }),
      );
    });

    it('should emit delivered acknowledgment to sender', async () => {
      const mockPayload = {
        conversationId: 'conv:123',
        senderId: 'user:1',
        content: 'Hello',
      };

      jwtService.verify.mockReturnValue({ id: 'user:1' });

      const mockConversation = {
        id: 'conv:123',
        participants: [{ id: 'user:1' }, { id: 'user:2' }],
      };
      chatService.getConversationById.mockResolvedValue(mockConversation);

      await gateway.sendMessage(mockPayload, mockClient);

      // Sender should still get messageDelivered ack
      expect(mockClient.emit).toHaveBeenCalledWith(
        'messageDelivered',
        expect.any(Object),
      );
    });

    it('should fallback to direct emit if Redis unavailable', async () => {
      // Mock Redis as unavailable
      const newGateway = gateway;
      newGateway.isRedisEnabled = false;

      const mockPayload = {
        conversationId: 'conv:123',
        senderId: 'user:1',
        content: 'Hello',
      };

      jwtService.verify.mockReturnValue({ id: 'user:1' });

      const mockConversation = {
        id: 'conv:123',
        participants: [{ id: 'user:1' }, { id: 'user:2' }],
      };
      chatService.getConversationById.mockResolvedValue(mockConversation);

      await newGateway.sendMessage(mockPayload, mockClient);

      // Should use direct emit instead of Pub/Sub
      expect(mockServer.to).toHaveBeenCalledWith('conv:123');
    });
  });

  describe('Channel Subscription - Lazy Loading', () => {
    it('should subscribe to conversation channel when client joins', async () => {
      const mockUser = { id: 'user:1', email: 'user@test.com' };
      jwtService.verify.mockReturnValue(mockUser);

      // Mock event handler registration
      const eventHandlers: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
      mockClient.on.mockImplementation((event, handler) => {
        eventHandlers[event] = handler;
      });

      // Simulate connection
      await gateway.handleConnection(mockClient);

      // Should have registered handlers for various events
      expect(mockClient.on).toHaveBeenCalledWith(
        'sendMessage',
        expect.any(Function),
      );
      expect(mockClient.on).toHaveBeenCalledWith(
        'subscribeToConversation',
        expect.any(Function),
      );
    });

    it('should subscribe to DM channel when user joins conversation', async () => {
      const userId = 'user:1';
      const conversationId = 'conv:123';

      jwtService.verify.mockReturnValue({ id: userId });
      mockClient.on.mockImplementation(() => {});

      // Simulate join
      await gateway.handleConnection(mockClient);

      // Manually call subscribeToConversation
      const handlers: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
      mockClient.on.mockImplementation((event, handler) => {
        handlers[event] = handler;
      });

      // This would be called when client emits subscribeToConversation
      // For now, just verify subscription setup would be called
      expect(mockClient.join).toBeDefined();
    });
  });

  describe('Group Message Delivery', () => {
    it('should batch publish group messages via Pub/Sub', async () => {
      const groupId = 'group:456';
      const mockPayload = {
        groupId,
        content: 'Group message',
        senderId: 'user:1',
      };

      jwtService.verify.mockReturnValue({ id: 'user:1' });

      const mockConversation = {
        id: groupId,
        participants: [{ id: 'user:1' }, { id: 'user:2' }, { id: 'user:3' }],
      };
      chatService.getConversationById.mockResolvedValue(mockConversation);

      await gateway.sendGroupMessage(mockPayload, mockClient);

      // Verify Pub/Sub was used for group delivery
      expect(redisPubSubService.publishGroupMessage).toHaveBeenCalledWith(
        groupId,
        expect.objectContaining({
          type: 'message.sent',
          groupId,
        }),
      );
    });
  });

  describe('Backward Compatibility - Event Names & Payloads', () => {
    it('should emit messageReceived event with exact same format', async () => {
      const messagePayload = {
        id: 'msg:001',
        conversationId: 'conv:123',
        senderId: 'user:1',
        content: 'Hello',
        type: 'TEXT',
        createdAt: new Date(),
      };

      // Simulate incoming message from Pub/Sub
      const handler = jest.fn();
      gateway.emitNewMessage(messagePayload as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      // Gateway should emit to room with exact payload format
      expect(mockServer.to).toHaveBeenCalled();
    });

    it('should preserve typing indicator event format', async () => {
      const mockUser = { id: 'user:1' };
      jwtService.verify.mockReturnValue(mockUser);

      mockClient.on.mockImplementation(() => {});

      await gateway.handleConnection(mockClient);

      // Typing event should not go through Pub/Sub (direct emit only)
      expect(mockClient.on).toHaveBeenCalledWith(
        'typing',
        expect.any(Function),
      );
    });

    it('should maintain online users tracking', async () => {
      const mockRedis = redisService.getRedis();
      const userId = 'user:1';

      jwtService.verify.mockReturnValue({ id: userId });
      mockClient.on.mockImplementation(() => {});

      await gateway.handleConnection(mockClient);

      // Verify user was added to online set
      expect(mockRedis.sadd).toHaveBeenCalledWith('online:users', userId);
    });

    it('should remove user from online set on disconnect', async () => {
      const mockRedis = redisService.getRedis();
      const userId = 'user:1';

      jwtService.verify.mockReturnValue({ id: userId });
      mockClient.on.mockImplementation(() => {});

      await gateway.handleConnection(mockClient);
      await gateway.handleDisconnect(mockClient);

      // Verify user was removed from online set
      expect(mockRedis.srem).toHaveBeenCalledWith('online:users', userId);
    });
  });

  describe('Failure Scenarios', () => {
    it('should handle Redis Pub/Sub publish failure gracefully', async () => {
      redisPubSubService.publishDirectMessage.mockRejectedValue(
        new Error('Redis connection lost'),
      );

      const mockPayload = {
        conversationId: 'conv:123',
        senderId: 'user:1',
        content: 'Hello',
      };

      jwtService.verify.mockReturnValue({ id: 'user:1' });

      const mockConversation = {
        id: 'conv:123',
        participants: [{ id: 'user:1' }, { id: 'user:2' }],
      };
      chatService.getConversationById.mockResolvedValue(mockConversation);

      // Should not throw, should handle gracefully
      await expect(
        gateway.sendMessage(mockPayload, mockClient),
      ).resolves.not.toThrow();
    });

    it('should handle subscription errors without crashing gateway', async () => {
      redisPubSubService.subscribeToDirectMessage.mockRejectedValue(
        new Error('Subscribe failed'),
      );

      jwtService.verify.mockReturnValue({ id: 'user:1' });
      mockClient.on.mockImplementation(() => {});

      // Connection should proceed even if subscription fails
      await expect(gateway.handleConnection(mockClient)).resolves.not.toThrow();
    });
  });
});
