import { Module } from '@nestjs/common';
import { MercadoPagoController } from './mercadopago.controller';
import { MercadopagoMapper } from './mercadopago.mapper';
import { MercadopagoConnector } from './mercadopago.connector';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '../subscription/entities/payment.entity';
import { MercadoPagoService } from './mercadopago.service';

@Module({
  imports: [TypeOrmModule.forFeature([Payment])],
  controllers: [MercadoPagoController],
  providers: [MercadoPagoService, MercadopagoMapper, MercadopagoConnector],
})
export class MercadoPagoModule {}
