import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  IsUrl,
} from 'class-validator';

export class SendMessageWithFilesDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  peerUserId: string;

  @ApiPropertyOptional({ maxLength: 5000 })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  text?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_protocol: true })
  linkUrl?: string;
}
