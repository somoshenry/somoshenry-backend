import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { WebRTCGateway } from './webrtc.gateway';
import { WebRTCService } from './webrtc.service';
import { WebRTCController } from './webrtc.controller';
import { UserModule } from '../user/user.module';
import { RoomChatService } from './room-chat.service';
import { IceServerManagerService } from './services/ice-server-manager.service';
import { SignalingStateMachineService } from './services/signaling-state-machine.service';
import { PeerConnectionTrackerService } from './services/peer-connection-tracker.service';
import { IceCandidateBufferService } from './services/ice-candidate-buffer.service';

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
  providers: [
    WebRTCService,
    RoomChatService,
    WebRTCGateway,
    IceServerManagerService,
    SignalingStateMachineService,
    PeerConnectionTrackerService,
    IceCandidateBufferService,
  ],
  exports: [
    WebRTCService,
    RoomChatService,
    IceServerManagerService,
    SignalingStateMachineService,
    PeerConnectionTrackerService,
    IceCandidateBufferService,
  ],
})
export class WebRTCModule {}
