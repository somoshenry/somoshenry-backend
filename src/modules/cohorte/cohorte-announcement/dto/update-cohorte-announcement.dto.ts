import { ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
import { CreateCohorteAnnouncementDto } from './create-cohorte-announcement.dto';
import { IsString, MaxLength, MinLength, IsOptional } from 'class-validator';

export class UpdateCohorteAnnouncementDto extends PartialType(
  CreateCohorteAnnouncementDto,
) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string;

  @IsOptional()
  @IsString()
  cohorteId?: string;
}
