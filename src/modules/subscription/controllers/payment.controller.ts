import { Controller, Get, Req } from '@nestjs/common';
import { AuthProtected } from 'src/modules/auth/decorator/auth-protected.decorator';
import { UserRole } from 'src/modules/user/entities/user.entity';
import { PaymentService } from '../services/payments.service';

@Controller('payment')
@AuthProtected(UserRole.MEMBER)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('history')
  async getPaymentHistory(@Req() req) {
    const userId = req.user.id;
    return this.paymentService.getPaymentsByUser(userId);
  }
}
