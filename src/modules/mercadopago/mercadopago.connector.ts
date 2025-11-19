import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MercadoPagoConfig,
  MerchantOrder,
  Payment,
  Preference,
} from 'mercadopago';
import { Config, Options } from 'mercadopago/dist/types';
import { PreferenceCreateData } from 'mercadopago/dist/clients/preference/create/types';
import { PreferenceResponse } from 'mercadopago/dist/clients/preference/commonTypes';
import { MerchantOrderResponse } from 'mercadopago/dist/clients/merchantOrder/commonTypes';
import { PaymentResponse } from 'mercadopago/dist/clients/payment/commonTypes';
import { DevLogger } from '../../common/utils/dev-logger';

@Injectable()
export class MercadopagoConnector {
  private client: MercadoPagoConfig;
  private preference: Preference;
  private MERCADOPAGO_ACCESS_TOKEN: string = 'MERCADOPAGO_ACCESS_TOKEN';
  private options: Options = { timeout: 10000 };
  private payment: Payment;
  private merchantOrders: MerchantOrder;

  constructor(private configService: ConfigService) {
    const mercadopagoApiKey = this.configService.get(
      this.MERCADOPAGO_ACCESS_TOKEN,
    ) as string;

    const config: Config = {
      accessToken: mercadopagoApiKey,
      options: this.options,
    };

    this.client = new MercadoPagoConfig(config);
    this.preference = new Preference(this.client);
    this.payment = new Payment(this.client);
    this.merchantOrders = new MerchantOrder(this.client);
  }

  async createPaymentPreference(
    preferenceCreateData: PreferenceCreateData,
  ): Promise<PreferenceResponse> {
    try {
      return await this.preference.create(preferenceCreateData);
    } catch (error) {
      DevLogger.error(error);
      throw error;
    }
  }

  async getPaymentDetails(paymentId: string): Promise<PaymentResponse> {
    try {
      return await this.payment.get({ id: paymentId });
    } catch (error) {
      DevLogger.error(' Error obteniendo detalles del pago:', error);
      throw error;
    }
  }

  async getMerchantOrderDetails(
    orderId: string,
  ): Promise<MerchantOrderResponse> {
    try {
      DevLogger.log(`Obteniendo detalles de la orden para ID: ${orderId}`);
      const order = await this.merchantOrders.get({ merchantOrderId: orderId });
      DevLogger.log('Detalles de la orden obtenidos:', order);
      return order;
    } catch (error) {
      DevLogger.error('Error obteniendo detalles de la orden:', error);
      throw error;
    }
  }
}
