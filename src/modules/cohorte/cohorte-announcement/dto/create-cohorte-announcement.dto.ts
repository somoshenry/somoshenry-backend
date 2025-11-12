import { IsString, MaxLength, IsUUID } from 'class-validator';

export class CreateCohorteAnnouncementDto {
  @IsUUID()
  cohorteId: string;

  @IsString()
  @MaxLength(200)
  title: string;

  @IsString()
  content: string;
}
