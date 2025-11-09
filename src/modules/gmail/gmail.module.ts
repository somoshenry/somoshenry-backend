import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { GmailController } from './gmail.controller';
import { GmailService } from './gmail.service';
import { GmailConnector } from './gmail.connector';
import { GmailMapper as GmailMapper } from './gmail.mapper';

@Module({
  imports: [ConfigModule],
  controllers: [GmailController],
  providers: [GmailService, GmailConnector, GmailMapper],
  exports: [GmailService, GmailConnector, GmailMapper],
})
export class GmailModule {}
