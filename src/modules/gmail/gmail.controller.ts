import { Controller, Post, Body, applyDecorators } from '@nestjs/common';
import { GmailDataDto } from './dto/gmail.data.dto';
import { GmailService } from './gmail.service';
import { SwaggerGmailDocs } from './docs/gmail.swagger';

@Controller('email')
export class GmailController {
  constructor(private readonly gmailService: GmailService) {}

  @Post('send')
  @applyDecorators(...SwaggerGmailDocs.sendMessage)
  sendMessaje(@Body() emailDataDto: GmailDataDto) {
    return this.gmailService.sendMessage(emailDataDto);
  }
}
