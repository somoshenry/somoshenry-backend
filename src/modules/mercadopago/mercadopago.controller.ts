import { Controller, Post, Body } from '@nestjs/common';
import { MercadoPagoService } from './mercadopago.service';
import { RequestPreferenceDto } from './request.preference.dto';
import type { MercadoPagoWebhookBody } from './mercadopago.interface';

@Controller('mercadopago')
export class MercadoPagoController {
  constructor(private readonly mercadoPagoService: MercadoPagoService) {}

  // NUEVO ENDPOINT: Crear preferenci
  @Post('create-preference')
  async createPreference(
    @Body()
    body: RequestPreferenceDto,
  ) {
    return await this.mercadoPagoService.createPaymentPreference(body);
  }

  @Post('webhook')
  async webhook(@Body() body: MercadoPagoWebhookBody) {
    // 👈 Tipado aplicado aquí
    console.log('🔔 Webhook recibido de Mercado Pago');

    // El cuerpo ya tiene las propiedades tipadas:
    const topic = body.topic || body.type;
    let resourceId = body.data?.id || body.id;

    // 🎯 La lógica de extracción del ID sigue siendo necesaria porque MP mezcla estructuras
    if (!resourceId && body.resource) {
      // TypeScript sabe que 'body' tiene la propiedad 'resource'
      const parts = body.resource.split('/');
      resourceId = parts[parts.length - 1].toString();
      resourceId = parts[parts.length - 1] + '';
      console.log(`✅ ID extraído de 'resource': ${resourceId}`);
    }

    if (!resourceId) {
      console.warn(
        '⚠️ No se pudo obtener el ID del recurso. Terminando procesamiento',
      );
      return { success: true, received: true };
    }

    // --- LÓGICA DE PROCESAMIENTO ---
    if (topic === 'payment') {
      console.log('💳 Procesando PAGO directamente:', resourceId);

      // Llamada centralizada al servicio para procesar el pago
      await this.mercadoPagoService.processPaymentNotification(resourceId);
    } else if (topic === 'merchant_order') {
      console.log(
        '📦 Procesando ORDEN DE COMERCIO (Merchant Order):',
        resourceId,
      );

      // ⚠️ AQUÍ NECESITARÁ UN NUEVO MÉTODO DE SERVICIO (Paso 2)
      const orderDetails =
        await this.mercadoPagoService.getMerchantOrderDetails(resourceId);

      if (orderDetails.payments && orderDetails.payments.length > 0) {
        const paymentId = orderDetails.payments[0].id as number; // Asume que es un número
        const paymentIdString = paymentId.toString();
        console.log(`✅ Pago asociado encontrado: ${paymentId}`);

        // Buscamos los detalles de este PAGO (usando su función existente)
        const paymentDetails =
          await this.mercadoPagoService.getPaymentDetails(paymentIdString);

        console.log('💰 Estado:', paymentDetails.status);
        console.log('📋 Status detail:', paymentDetails.status_detail);

        // ... Aquí puede poner el resto de su lógica de logging/almacenamiento ...
      }
    }

    // ...

    return { success: true, received: true };
  }
  catch(error) {
    console.error('❌ Error fatal en Webhook:');
    console.error(error); // <--- Asegúrese de loguear el objeto de error completo
    return { success: false, error: 'Internal error', received: true };
  }
}
