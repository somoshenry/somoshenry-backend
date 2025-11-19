import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class CreateCohorteAnnouncementDto {
  @ApiProperty({ example: 'Recordatorio importante' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'Mañana tenemos clase a las 18hs' })
  @IsString()
  @MinLength(1)
  content: string;

  // El controller se lo setea, no lo envía el usuario
  cohorteId?: string;
}
