import { Controller, Get, Req } from '@nestjs/common';
import { AuthProtected } from 'src/modules/auth/decorator/auth-protected.decorator';
import { UserRole } from 'src/modules/user/entities/user.entity';
import { SubscriptionService } from '../services/subscription.service';

@Controller('subscription')
@AuthProtected(UserRole.MEMBER)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('current')
  async getCurrent(@Req() req) {
    const userId = req.user.id;
    return this.subscriptionService.getCurrentSubscription(userId);
  }
}
