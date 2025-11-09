import { Injectable } from '@nestjs/common';
import { GmailConnector } from './gmail.connector';
import { GmailMapper } from './gmail.mapper';
import { GmailDataDto } from './dto/gmail.data.dto';
import { GmailResponseDto } from './dto/gmail.response.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GmailService {
  private userEmail: string;

  constructor(
    private configService: ConfigService,
    private gmailConnector: GmailConnector,
    private gmailMapper: GmailMapper,
  ) {
    this.userEmail = this.configService.get('GMAIL_USER_EMAIL') || '';
  }

  async sendMessage(emailDataDto: GmailDataDto): Promise<GmailResponseDto> {
    const message = this.gmailMapper.mapToGmailMessageEncode(
      emailDataDto,
      this.userEmail,
    );
    const schemaMessage = await this.gmailConnector.sendEmail(message);

    return this.gmailMapper.mapToGmailResponseDto(schemaMessage);
  }
}
