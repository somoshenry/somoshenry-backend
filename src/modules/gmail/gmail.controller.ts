import { Controller, Post, Body } from '@nestjs/common';
import { GmailDataDto } from './dto/gmail.data.dto';
import { GmailService } from './gmail.service';

@Controller('email')
export class GmailController {
  constructor(private readonly gmailService: GmailService) {}

  @Post('send')
  sendMessaje(@Body() emailDataDto: GmailDataDto) {
    return this.gmailService.sendMessage(emailDataDto);
  }
}
