import { IsString, IsNotEmpty } from 'class-validator';

export class WebRTCSignalDto {
  @IsString()
  @IsNotEmpty()
  roomId!: string;

  @IsString()
  @IsNotEmpty()
  targetUserId!: string;

  @IsNotEmpty()
  sdp!: any;
}
