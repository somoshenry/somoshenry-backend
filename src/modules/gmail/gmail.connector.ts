import { Injectable } from '@nestjs/common';
import { gmail_v1, google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { GmailMessageEncode } from './dto/gmail.message.encode';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GmailConnector {
  private readonly GMAIL_USER_ID = 'me';
  private clientId: string;
  private clientSecret: string;
  private refreshToken: string;
  private redirectUri: string;

  constructor(private configService: ConfigService) {
    this.clientId = this.configService.get('GMAIL_CLIENT_ID') as string;
    this.clientSecret = this.configService.get('GMAIL_CLIENT_SECRET') as string;
    this.refreshToken = this.configService.get('GMAIL_REFRESH_TOKEN') as string;
    this.redirectUri = this.configService.get('GMAIL_REDIRECT_URI') as string;
  }

  private createOAuthClient(): OAuth2Client {
    const client = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      this.redirectUri,
    );

    client.setCredentials({ refresh_token: this.refreshToken });
    return client;
  }

  private createGmailClient(auth: OAuth2Client): gmail_v1.Gmail {
    return google.gmail({ version: 'v1', auth });
  }

  private async sendEncodedMessage(
    gmail: gmail_v1.Gmail,
    encodedMessage: string,
  ) {
    return await gmail.users.messages.send({
      userId: this.GMAIL_USER_ID,
      requestBody: { raw: encodedMessage },
    });
  }

  async sendEmail(
    emailMessageEncode: GmailMessageEncode,
  ): Promise<gmail_v1.Schema$Message> {
    try {
      const oauth = this.createOAuthClient();
      const gmail = this.createGmailClient(oauth);
      const encoded = emailMessageEncode.messageEncoded;
      const result = await this.sendEncodedMessage(gmail, encoded);
      return result.data;
    } catch (error) {
      console.error('❌ Error:', error);
      throw new Error(`Fallo al enviar email: ${error}`);
    }
  }
}
