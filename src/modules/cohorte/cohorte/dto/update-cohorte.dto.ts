import { PartialType } from '@nestjs/swagger';
import { CreateCohorteDto } from './create-cohorte.dto';

export class UpdateCohorteDto extends PartialType(CreateCohorteDto) {}
