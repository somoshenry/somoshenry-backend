import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class IceCandidateDto {
  @IsString()
  @IsNotEmpty()
  roomId!: string;

  @IsString()
  @IsNotEmpty()
  targetUserId!: string;

  @IsNotEmpty()
  candidate!: any;

  @IsNumber()
  @IsOptional()
  sequence?: number;

  @IsString()
  @IsOptional()
  messageId?: string;
}
