import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import * as request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { getConnectionToken } from '@nestjs/mongoose';
import { io, Socket } from 'socket.io-client';
import { JwtService } from '@nestjs/jwt';

describe('CHAT E2E FULL SYSTEM', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;
  let mongoConnection: any;

  let jwtService: JwtService;
  let socket: Socket;

  let userId: string;
  let token: string;
  let conversationId: string;
  let messageId: string;

  beforeAll(async () => {
    // MongoDB en memoria
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    process.env.MONGO_URL = mongoUri;
    process.env.REDIS_URL = 'redis://mock-redis:6379';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    mongoConnection = moduleRef.get(getConnectionToken());
    jwtService = moduleRef.get(JwtService);
  });

  afterAll(async () => {
    await mongoConnection.close();
    await mongoServer.stop();
    await app.close();
  });

  // -----------------------------
  // CREATE USER (required for chat)
  // -----------------------------
  it('Create test user', async () => {
    const res = await request(app.getHttpServer()).post('/auth/register').send({
      email: 'test@chat.com',
      password: '123456',
      name: 'Test',
    });

    userId = res.body.id;
    token = jwtService.sign({ sub: userId });

    expect(userId).toBeDefined();
  });

  // ---------------------------------
  // CREATE CONVERSATION
  // ---------------------------------
  it('Create conversation', async () => {
    const res = await request(app.getHttpServer())
      .post('/chat/conversations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        participants: [userId],
      });

    conversationId = res.body.id;

    expect(conversationId).toBeDefined();
  });

  // ---------------------------------
  // SEND MESSAGE (Mongo)
  // ---------------------------------
  it('Send message (Mongo)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/chat/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        conversationId,
        content: 'Hello from test!',
      });

    messageId = res.body.id;

    expect(messageId).toBeDefined();
  });

  // ---------------------------------
  // SOCKET.IO TEST (realtime)
  // ---------------------------------
  it('WebSocket receives new message in real time', (done) => {
    socket = io('http://localhost:3000', {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      socket.emit('message.send', {
        conversationId,
        content: 'Hello via socket!',
      });
    });

    socket.on('message.new', (msg) => {
      expect(msg.conversationId).toBe(conversationId);
      expect(msg.content).toBe('Hello via socket!');
      socket.close();
      done();
    });
  });

  // ---------------------------------
  // GET ALL MESSAGES
  // ---------------------------------
  it('Get messages from conversation', async () => {
    const res = await request(app.getHttpServer())
      .get(`/chat/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.length).toBeGreaterThan(0);
  });

  // ---------------------------------
  // MARK AS READ
  // ---------------------------------
  it('Mark message as read', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/chat/messages/${messageId}/read`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.isRead).toBe(true);
  });
});
