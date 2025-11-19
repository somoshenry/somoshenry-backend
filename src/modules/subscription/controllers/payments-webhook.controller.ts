// // src/subscription/payments-webhook.controller.ts
// import {
//   Controller,
//   Post,
//   Body,
//   Headers,
//   HttpCode,
//   HttpStatus,
// } from '@nestjs/common';
// import { ApiTags } from '@nestjs/swagger';
// import { SubscriptionService } from '../services/subscription.service';
// import { Public } from '../../../common/decorators/public.decorator';
// import { ApiMercadoPagoWebhook } from '../docs';

// // ============================================
// // ENDPOINTS PARA WEBHOOKS DE PAGOS
// // ============================================

// @ApiTags('Webhook de Mercado Pago')
// @Controller('payments')
// export class PaymentsWebhookController {
//   constructor(private readonly subscriptionService: SubscriptionService) {}

//   // WEBHOOK: Mercado Pago notifica el estado del pago
//   @Post('webhook')
//   @Public()
//   @HttpCode(HttpStatus.OK)
//   @ApiMercadoPagoWebhook()
//   async handleWebhook(
//     @Body() body: any,
//     @Headers('x-signature') signature: string,
//   ) {
//     console.log('Webhook recibido:', JSON.stringify(body, null, 2));

//     // Validar firma (opcional pero recomendado)
//     // this.validateSignature(body, signature);

//     // Procesar notificación
//     if (body.type === 'payment') {
//       const paymentId = body.data.id;
//       await this.subscriptionService.processPaymentNotification(paymentId);
//     }

//     return { status: 'ok' };
//   }
// }
