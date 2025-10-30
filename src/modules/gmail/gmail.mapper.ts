import { Injectable } from '@nestjs/common';
import { GmailDataDto } from './dto/gmail.data.dto';
import { GmailMessageEncode } from './dto/gmail.message.encode';
import { gmail_v1 } from 'googleapis';
import { GmailResponseDto } from './dto/gmail.response.dto';

@Injectable()
export class GmailMapper {
  private buildEmailMessage(
    emalDataDto: GmailDataDto,
    emailFrom: string,
  ): string {
    const parts = [
      `From: ${emailFrom}`,
      `To: ${emalDataDto.to}`,
      `Subject: ${emalDataDto.subject}`,
      'Content-Type: text/html; charset=utf-8',
      '',
      `html: ${emalDataDto.html}`,
    ];

    return parts.join('\n');
  }

  private encodeMessageForGmail(message: string): string {
    return Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
  mapToGmailMessageEncode(
    emalDataDto: GmailDataDto,
    emailFrom: string,
  ): GmailMessageEncode {
    const message = this.buildEmailMessage(emalDataDto, emailFrom);

    const emailMessageEncode = new GmailMessageEncode();
    emailMessageEncode.messageEncoded = this.encodeMessageForGmail(message);
    return emailMessageEncode;
  }

  mapToGmailResponseDto(schemaMessage: gmail_v1.Schema$Message) {
    const gmailResponseDto = new GmailResponseDto();
    gmailResponseDto.dataId = schemaMessage.id as string;
    return gmailResponseDto;
  }
}
