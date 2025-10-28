import { HttpStatus } from '@nestjs/common';

export class ResponseOkDto {
  statusCode: HttpStatus = HttpStatus.OK;
  message: string = 'Logout successful';
}
