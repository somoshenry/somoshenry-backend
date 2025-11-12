import { PartialType } from '@nestjs/swagger';
import { CreateCohorteClassDto } from './create-cohorte-class.dto';

export class UpdateCohorteClassDto extends PartialType(CreateCohorteClassDto) {}
