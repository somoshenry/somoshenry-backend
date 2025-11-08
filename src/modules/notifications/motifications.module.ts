import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { GmailModule } from '../gmail/gmail.module';
import { GmailService } from '../gmail/gmail.service';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [GmailModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, GmailService],
  exports: [NotificationsService],
})
export class NotificationModule {}
