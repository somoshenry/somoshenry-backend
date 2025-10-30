import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { GmailConnector } from './gmail.connector';
import { GmailMapper } from './gmail.mapper';
import { GmailDataDto } from './dto/gmail.data.dto';
import { GmailResponseDto } from './dto/gmail.response.dto';

dotenv.config({ path: path.resolve(process.cwd(), '.env.development') });

@Injectable()
export class GmailService {
  private userEmail: string;

  constructor(
    private gmailConnector: GmailConnector,
    private gmailMapper: GmailMapper,
  ) {
    this.userEmail = process.env.GMAIL_USER_EMAIL || '';
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
