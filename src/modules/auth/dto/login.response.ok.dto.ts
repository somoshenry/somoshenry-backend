import { HttpStatus } from '@nestjs/common';

export class LoginResponseOkDto {
  statusCode: HttpStatus = HttpStatus.OK;
  message: string = 'Logout successful';
  token: string;
}
