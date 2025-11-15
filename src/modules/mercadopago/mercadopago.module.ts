import { Module } from '@nestjs/common';
import { MercadoPagoController } from './mercadopago.controller';
import { MercadopagoMapper } from './mercadopago.mapper';
import { MercadopagoConnector } from './mercadopago.connector';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '../subscription/entities/payment.entity';
import { MercadoPagoService } from './mercadopago.service';
import { User } from '../user/entities/user.entity';
import { Subscription } from '../subscription/entities/subscription.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, User, Subscription])],
  controllers: [MercadoPagoController],
  providers: [MercadoPagoService, MercadopagoMapper, MercadopagoConnector],
})
export class MercadoPagoModule {}
