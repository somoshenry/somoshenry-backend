import { Module } from '@nestjs/common';
import { MercadoPagoService } from './mercadopago.service';
import { MercadoPagoController } from './mercadopago.controller';
import { MercadopagoMapper } from './mercadopago.mapper';
import { MercadopagoConnector } from './mercadopago.connector';

@Module({
  controllers: [MercadoPagoController],
  providers: [MercadoPagoService, MercadopagoMapper, MercadopagoConnector],
  exports: [MercadoPagoService],
})
export class MercadoPagoModule {}
