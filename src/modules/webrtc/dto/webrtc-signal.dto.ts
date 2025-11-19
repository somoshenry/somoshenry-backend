import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class WebRTCSignalDto {
  @IsString()
  @IsNotEmpty()
  roomId!: string;

  @IsString()
  @IsNotEmpty()
  targetUserId!: string;

  @IsNotEmpty()
  sdp!: any;

  @IsNumber()
  @IsOptional()
  sequence?: number;

  @IsString()
  @IsOptional()
  messageId?: string;
}
