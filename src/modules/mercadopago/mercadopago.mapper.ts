import { Items } from 'mercadopago/dist/clients/commonTypes';
import {
  BackUrls,
  Payer,
  PreferenceRequest,
  PreferenceResponse,
} from 'mercadopago/dist/clients/preference/commonTypes';
import { PreferenceCreateData } from 'mercadopago/dist/clients/preference/create/types';
import { RequestPreferenceDto } from './request.preference.dto';
import { RequestProductDto } from './request.product.dto';
import { Injectable } from '@nestjs/common';
import { ResponsePreferenceDto } from './responce.preference.dto';
import { ConfigService } from '@nestjs/config';

function buidItem(product: RequestProductDto) {
  const item: Items = {
    id: 'item-' + Date.now(),
    title: product.title,
    quantity: product.quantity,
    unit_price: product.price,
    currency_id: 'ARS',
  };
  return item;
}

function buildBackUrls(frontUrl: string) {
  const backUrls: BackUrls = {
    // Cambia el nombre del archivo en el servidor y usa solo la barra (/).
    success: `${frontUrl}/redirect?status=success`,
    pending: `${frontUrl}/redirect?status==pending`,
    failure: `${frontUrl}/redirect?status=failure`,
  };
  return backUrls;
}

@Injectable()
export class MercadopagoMapper {
  private frontUrl: string;
  private backendUrl: string;
  constructor(private configService: ConfigService) {
    this.frontUrl = this.configService.get('FRONTEND_URL_BASE') as string;
    this.backendUrl = this.configService.get('BACKEND_URL') as string;
  }
  mapToPreferenceCreateData(requestPreferenceDto: RequestPreferenceDto) {
    const payer: Payer = { email: requestPreferenceDto.clientEmail }; // Cliente

    const items: Array<Items> = requestPreferenceDto.products.map((product) =>
      buidItem(product),
    ); // productos

    const backUrls: BackUrls = buildBackUrls(this.frontUrl);

    const preferenceRequest: PreferenceRequest = {
      items: items,
      payer: payer,
      back_urls: backUrls,
      notification_url: `${this.backendUrl}/mercadopago/webhook`,
    };

    const preferenceCreateData: PreferenceCreateData = {
      body: preferenceRequest,
    };

    return preferenceCreateData;
  }

  mapToResponsePreferenceDto(preferenceResponse: PreferenceResponse) {
    const responsePreferenceDto = new ResponsePreferenceDto();
    responsePreferenceDto.success = true;
    responsePreferenceDto.preferenceId = preferenceResponse.id;
    responsePreferenceDto.initPoint = preferenceResponse.init_point;
    responsePreferenceDto.sandboxInitPoint =
      preferenceResponse.sandbox_init_point;
    return responsePreferenceDto;
  }
}
