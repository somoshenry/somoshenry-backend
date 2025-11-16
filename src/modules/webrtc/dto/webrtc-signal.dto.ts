import { IsString } from 'class-validator';

export class WebRTCSignalDto {
  @IsString()
  targetUserId: string;

  @IsString()
  roomId: string;

  @IsString()
  type: 'offer' | 'answer';

  @IsString()
  sdp: string;
}
