import { PartialType } from '@nestjs/swagger';
import { CreateCohorteAnnouncementDto } from './create-cohorte-announcement.dto';

export class UpdateCohorteAnnouncementDto extends PartialType(
  CreateCohorteAnnouncementDto,
) {}
