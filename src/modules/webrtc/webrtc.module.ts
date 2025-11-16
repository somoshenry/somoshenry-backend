import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { WebRTCGateway } from './webrtc.gateway';
import { WebRTCService } from './webrtc.service';
import { WebRTCController } from './webrtc.controller';
import { UserModule } from '../user/user.module';
import { RoomChatService } from './room-chat.service';

// MongoDB schema para chat de rooms
const RoomChatMessageSchema = {
  roomId: String,
  userId: String,
  userName: String,
  userAvatar: { type: String, default: null },
  message: String,
  timestamp: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
};

@Module({
  imports: [
    UserModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
    MongooseModule.forFeature([
      { name: 'RoomChatMessage', schema: RoomChatMessageSchema },
    ]),
  ],
  controllers: [WebRTCController],
  providers: [WebRTCService, RoomChatService, WebRTCGateway],
  exports: [WebRTCService, RoomChatService],
})
export class WebRTCModule {}
