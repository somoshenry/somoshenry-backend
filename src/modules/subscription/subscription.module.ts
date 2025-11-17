import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
// import { SubscriptionController } from './controllers/subscription.controller';
import { SubscriptionService } from './services/subscription.service';
import { PaymentService } from './services/payments.service';
import { Subscription } from './entities/subscription.entity';
import { Payment } from './entities/payment.entity';
import { PostModule } from '../post/post.module';
import { User } from '../user/entities/user.entity';
// import { SubscriptionAdminController } from './controllers/subscription-admin.controller';
import { UserModule } from '../user/user.module';
import { SubscriptionController } from './controllers/subscription.controller';
import { PaymentController } from './controllers/payment.controller';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, Payment, User]),
    ScheduleModule.forRoot(),
    ConfigModule,
    UserModule,
    forwardRef(() => PostModule), // Evitar dependencia circular
  ],
  controllers: [
    SubscriptionController,
    PaymentController,
    // SubscriptionAdminController,
  ],
  providers: [SubscriptionService, PaymentService],
  exports: [SubscriptionService, PaymentService],
})
export class SubscriptionModule {}
