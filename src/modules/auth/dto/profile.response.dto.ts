import { HttpStatus } from '@nestjs/common';
import { GoogleProfileDto } from './google-profile.dto';

export class ProfileResponseDto {
  status: HttpStatus;
  user: GoogleProfileDto;
}
