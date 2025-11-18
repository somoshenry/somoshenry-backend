import { IsString, IsBoolean, IsOptional, IsNotEmpty } from 'class-validator';

export class JoinRoomDto {
  @IsString()
  @IsNotEmpty()
  roomId!: string;

  @IsBoolean()
  @IsOptional()
  audio?: boolean;

  @IsBoolean()
  @IsOptional()
  video?: boolean;
}
