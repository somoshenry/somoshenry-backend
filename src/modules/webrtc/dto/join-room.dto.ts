import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class JoinRoomDto {
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsOptional()
  @IsBoolean()
  audio?: boolean = true;

  @IsOptional()
  @IsBoolean()
  video?: boolean = true;
}
