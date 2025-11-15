import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { WebRTCGateway } from './webrtc.gateway';
import { WebRTCService } from './webrtc.service';
import { WebRTCController } from './webrtc.controller';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [WebRTCController],
  providers: [WebRTCGateway, WebRTCService],
  exports: [WebRTCService],
})
export class WebRTCModule {}
