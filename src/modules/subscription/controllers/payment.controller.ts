import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { AuthProtected } from 'src/modules/auth/decorator/auth-protected.decorator';
import { UserRole } from 'src/modules/user/entities/user.entity';
import { PaymentService } from '../services/payments.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ApiTags } from '@nestjs/swagger';

import {
  ApiGetPaymentHistory,
  ApiGetPaymentReceipt,
  ApiGetPaymentStats,
} from '../docs';

@ApiTags('Gestión de pagos (User)')
@Controller('payment')
@AuthProtected(UserRole.MEMBER)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // HISTORIAL DE PAGOS

  @Get('history')
  @ApiGetPaymentHistory()
  async getPaymentHistory(
    @Req() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const userId = req.user.id;
    return this.paymentService.getUserPayments(
      userId,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }

  // RECIBO DE PAGO

  @Get('receipt/:paymentId')
  @ApiGetPaymentReceipt()
  async getPaymentReceipt(
    @CurrentUser('id') userId: string,
    @Param('paymentId') paymentId: string,
  ) {
    return this.paymentService.getPaymentReceipt(userId, paymentId);
  }

  // ESTADÍSTICAS (si tienes este método)

  @Get('stats')
  @ApiGetPaymentStats()
  async getPaymentStats(@CurrentUser('id') userId: string) {
    return this.paymentService.getUserPaymentStats(userId);
  }
}
