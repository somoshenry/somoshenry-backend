import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { PaymentsService } from './payments.service';
import { SubscriptionCron } from './subscription.cron';
import { Subscription } from './entities/subscription.entity';
import { Payment } from './entities/payment.entity';
import { PostModule } from '../post/post.module';
import { User } from '../user/entities/user.entity';
import { SubscriptionAdminController } from './subscription-admin.controller';
import { PaymentsWebhookController } from './payments-webhook.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, Payment, User]),
    ConfigModule,
    UserModule,
    forwardRef(() => PostModule), // Evitar dependencia circular
  ],
  controllers: [
    SubscriptionController,
    SubscriptionAdminController,
    PaymentsWebhookController,
  ],
  providers: [SubscriptionService, PaymentsService, SubscriptionCron],
  exports: [SubscriptionService, PaymentsService],
})
export class SubscriptionModule {}
