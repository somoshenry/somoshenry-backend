// import { Injectable, NotFoundException } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import {
//   Payment,
//   PaymentStatus,
// } from '../subscription/entities/payment.entity';
// import { PaymentResponse } from 'mercadopago/dist/clients/payment/commonTypes';

// @Injectable()
// export class PaymentsService {
//   constructor(
//     @InjectRepository(Payment)
//     private paymentsRepository: Repository<Payment>,
//   ) {}

//   /**
//    * 💾 Crea o actualiza un pago en la BD a partir de la respuesta de MercadoPago
//    * ADAPTADO A TU ESTRUCTURA DE ENTIDADES - SIN ERRORES DE TYPESCRIPT
//    */
//   async upsertPaymentFromMercadoPago(
//     paymentDetails: PaymentResponse,
//   ): Promise<Payment> {
//     // Validar que tenemos el ID
//     if (!paymentDetails.id) {
//       throw new Error('Payment details must have an id');
//     }

//     const mpPaymentId = paymentDetails.id.toString();

//     // Buscar si ya existe un pago con este mercadoPagoId
//     let payment = await this.paymentsRepository.findOne({
//       where: { mercadoPagoId: mpPaymentId },
//     });

//     const isNew = !payment;

//     // Si no existe, crear uno nuevo
//     if (!payment) {
//       payment = this.paymentsRepository.create();
//       console.log('📝 Creando nuevo registro de pago en BD');
//     } else {
//       console.log('♻️ Actualizando pago existente en BD');
//     }

//     // ===== MAPEAR DATOS DE MERCADOPAGO A TU ENTIDAD =====

//     // IDs de MercadoPago
//     payment.mercadoPagoId = mpPaymentId;
//     payment.mercadoPagoStatus = paymentDetails.status ?? 'unknown';

//     // Mapear status de MercadoPago a tu enum PaymentStatus
//     payment.status = this.mapMercadoPagoStatusToPaymentStatus(
//       paymentDetails.status ?? 'pending',
//     );

//     // Montos - con validación
//     if (paymentDetails.transaction_amount === undefined) {
//       throw new Error('Payment must have a transaction_amount');
//     }
//     payment.amount = paymentDetails.transaction_amount;
//     payment.currency = paymentDetails.currency_id ?? 'ARS';

//     // Método de pago
//     payment.paymentMethod = paymentDetails.payment_method_id ?? 'unknown';
//     payment.paymentType = paymentDetails.payment_type_id ?? 'unknown';

//     // Descripción
//     payment.description = paymentDetails.description ?? 'Pago de subscripción';

//     // Fecha de pago (si fue aprobado)
//     if (paymentDetails.date_approved) {
//       payment.paidAt = new Date(paymentDetails.date_approved);
//     }

//     // Fechas de creación de MP
//     if (isNew && paymentDetails.date_created) {
//       payment.billingDate = new Date(paymentDetails.date_created);
//     }

//     // Si el pago fue rechazado, guardar el motivo
//     if (paymentDetails.status === 'rejected' && paymentDetails.status_detail) {
//       payment.failureReason = this.getFailureReasonMessage(
//         paymentDetails.status_detail,
//       );
//     }

//     // 🔑 IMPORTANTE: Extraer el user_id
//     // Opción 1: Desde metadata
//     if (paymentDetails.metadata?.user_id) {
//       payment.userId = paymentDetails.metadata.user_id;
//     }
//     // Opción 2: Desde external_reference (formato: "USER_abc123_ORDER_xyz")
//     else if (paymentDetails.external_reference) {
//       const match = paymentDetails.external_reference.match(/USER_([^_]+)/);
//       if (match && match[1]) {
//         payment.userId = match[1];
//       }
//     }

//     // 🔑 IMPORTANTE: Extraer subscription_id si viene en metadata
//     if (paymentDetails.metadata?.subscription_id) {
//       payment.subscriptionId = paymentDetails.metadata.subscription_id;
//     }

//     // Periodo cubierto por el pago (si viene en metadata)
//     if (paymentDetails.metadata?.period_start) {
//       payment.periodStart = new Date(paymentDetails.metadata.period_start);
//     }
//     if (paymentDetails.metadata?.period_end) {
//       payment.periodEnd = new Date(paymentDetails.metadata.period_end);
//     }

//     // Si no se especificaron periodos, usar valores por defecto (1 mes desde ahora)
//     if (isNew && !payment.periodStart) {
//       payment.periodStart = new Date();
//       payment.periodEnd = new Date();
//       payment.periodEnd.setDate(payment.periodEnd.getDate() + 30);
//     }

//     if (isNew && !payment.billingDate) {
//       payment.billingDate = new Date();
//     }

//     // Guardar en la base de datos
//     const savedPayment = await this.paymentsRepository.save(payment);
//     console.log(`✅ Pago guardado/actualizado en BD: ${savedPayment.id}`);

//     return savedPayment;
//   }

//   /**
//    * 🔄 Mapea el status de MercadoPago a tu enum PaymentStatus
//    */
//   private mapMercadoPagoStatusToPaymentStatus(mpStatus: string): PaymentStatus {
//     const statusMap: Record<string, PaymentStatus> = {
//       approved: PaymentStatus.APPROVED,
//       pending: PaymentStatus.PENDING,
//       in_process: PaymentStatus.PENDING,
//       rejected: PaymentStatus.FAILED,
//       cancelled: PaymentStatus.CANCELLED,
//       refunded: PaymentStatus.REFUNDED,
//       charged_back: PaymentStatus.REFUNDED,
//     };

//     return statusMap[mpStatus] ?? PaymentStatus.PENDING;
//   }

//   /**
//    * 💬 Convierte códigos de error de MP a mensajes legibles
//    */
//   private getFailureReasonMessage(statusDetail: string): string {
//     const messages: Record<string, string> = {
//       cc_rejected_insufficient_amount: 'Fondos insuficientes',
//       cc_rejected_bad_filled_card_number: 'Número de tarjeta inválido',
//       cc_rejected_bad_filled_security_code: 'Código de seguridad incorrecto',
//       cc_rejected_bad_filled_date: 'Fecha de vencimiento inválida',
//       cc_rejected_high_risk: 'Rechazado por medidas de seguridad',
//       cc_rejected_call_for_authorize: 'Debe autorizar el pago con su banco',
//       cc_rejected_card_disabled: 'Tarjeta deshabilitada',
//       cc_rejected_blacklist: 'Tarjeta en lista negra',
//       cc_rejected_duplicated_payment: 'Pago duplicado',
//       cc_rejected_max_attempts: 'Límite de intentos alcanzado',
//     };

//     return messages[statusDetail] ?? `Pago rechazado: ${statusDetail}`;
//   }

//   /**
//    * 🔍 Busca un pago por su mercadoPagoId
//    */
//   async findByMercadoPagoId(mpPaymentId: string): Promise<Payment | null> {
//     return await this.paymentsRepository.findOne({
//       where: { mercadoPagoId: mpPaymentId },
//       relations: ['subscription', 'user'],
//     });
//   }

//   /**
//    * 👤 Obtiene todos los pagos de un usuario
//    */
//   async findByUserId(userId: string): Promise<Payment[]> {
//     return await this.paymentsRepository.find({
//       where: { userId: userId },
//       order: { createdAt: 'DESC' },
//       relations: ['subscription'],
//     });
//   }

//   /**
//    * 🎫 Obtiene todos los pagos de una subscripción
//    */
//   async findBySubscriptionId(subscriptionId: string): Promise<Payment[]> {
//     return await this.paymentsRepository.find({
//       where: { subscriptionId: subscriptionId },
//       order: { createdAt: 'DESC' },
//     });
//   }

//   /**
//    * ✅ Obtiene solo los pagos aprobados de un usuario
//    */
//   async findApprovedPaymentsByUserId(userId: string): Promise<Payment[]> {
//     return await this.paymentsRepository.find({
//       where: {
//         userId: userId,
//         status: PaymentStatus.APPROVED,
//       },
//       order: { paidAt: 'DESC' },
//       relations: ['subscription'],
//     });
//   }

//   /**
//    * 📊 Obtiene estadísticas de pagos de un usuario
//    */
//   async getUserPaymentStats(userId: string) {
//     const payments = await this.findByUserId(userId);

//     const stats = {
//       total_payments: payments.length,
//       approved: payments.filter((p) => p.status === PaymentStatus.APPROVED)
//         .length,
//       failed: payments.filter((p) => p.status === PaymentStatus.FAILED).length,
//       pending: payments.filter((p) => p.status === PaymentStatus.PENDING)
//         .length,
//       cancelled: payments.filter((p) => p.status === PaymentStatus.CANCELLED)
//         .length,
//       refunded: payments.filter((p) => p.status === PaymentStatus.REFUNDED)
//         .length,
//       total_amount: payments
//         .filter((p) => p.status === PaymentStatus.APPROVED)
//         .reduce((sum, p) => sum + Number(p.amount), 0),
//       last_payment: payments[0]?.createdAt ?? null,
//     };

//     return stats;
//   }

//   /**
//    * 🔍 Busca un pago por ID interno
//    */
//   async findById(paymentId: string): Promise<Payment> {
//     const payment = await this.paymentsRepository.findOne({
//       where: { id: paymentId },
//       relations: ['subscription', 'user'],
//     });

//     if (!payment) {
//       throw new NotFoundException(`Payment with ID ${paymentId} not found`);
//     }

//     return payment;
//   }

//   /**
//    * 📋 Obtiene todos los pagos (con paginación opcional)
//    */
//   async findAll(page = 1, limit = 50): Promise<Payment[]> {
//     return await this.paymentsRepository.find({
//       order: { createdAt: 'DESC' },
//       skip: (page - 1) * limit,
//       take: limit,
//       relations: ['subscription', 'user'],
//     });
//   }

//   /**
//    * 🔄 Marca un pago como reembolsado
//    */
//   async markAsRefunded(
//     paymentId: string,
//     refundAmount?: number,
//   ): Promise<Payment> {
//     const payment = await this.findById(paymentId);

//     payment.status = PaymentStatus.REFUNDED;
//     payment.refundedAmount = refundAmount ?? payment.amount;
//     payment.refundedAt = new Date();

//     return await this.paymentsRepository.save(payment);
//   }

//   /**
//    * 🗑️ Elimina un pago (úsalo con cuidado)
//    */
//   async delete(paymentId: string): Promise<void> {
//     await this.paymentsRepository.delete(paymentId);
//   }

//   /**
//    * 🔄 Actualiza el subscriptionId de un pago
//    */
//   async updateSubscriptionId(
//     paymentId: string,
//     subscriptionId: string,
//   ): Promise<Payment> {
//     const payment = await this.findById(paymentId);
//     payment.subscriptionId = subscriptionId;
//     return await this.paymentsRepository.save(payment);
//   }
// }
