import { Controller, Post, Body } from '@nestjs/common';
import { MercadoPagoService } from './mercadopago.service';
import { RequestPreferenceDto } from './request.preference.dto';
import type { MercadoPagoWebhookBody } from './mercadopago.interface';

@Controller('mercadopago')
export class MercadoPagoController {
  constructor(private readonly mercadoPagoService: MercadoPagoService) {}

  @Post('create-preference')
  async createPreference(
    @Body()
    body: RequestPreferenceDto,
  ) {
    return await this.mercadoPagoService.createPaymentPreference(body);
  }

  @Post('webhook')
  async webhook(@Body() body: MercadoPagoWebhookBody) {
    console.log('🔔 Webhook de Mercado Pago recibido:', body);
    return await this.mercadoPagoService.webhook(body);
  }
}
