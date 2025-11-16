import { IsString, IsOptional, IsNumber } from 'class-validator';

export class IceCandidateDto {
  @IsString()
  targetUserId: string;

  @IsString()
  roomId: string;

  @IsString()
  candidate: string;

  @IsString()
  sdpMid: string;

  @IsOptional()
  @IsNumber()
  sdpMLineIndex?: number;
}
