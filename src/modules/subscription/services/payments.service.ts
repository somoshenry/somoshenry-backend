import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import { Payment } from '../entities/payment.entity';
import { DateUtil } from '../../../common/utils/date.util';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}
}
// // ============================================
// // ESTADÍSTICAS GENERALES
// // ============================================
// async getGeneralStats() {
//   const now = DateUtil.nowUTC();
//   const monthStart = DateUtil.getStartOfMonth();
//   const lastMonthStart = DateUtil.addMonth(monthStart, -1);

//   // Ingresos del mes actual
//   const currentMonthRevenue = await this.paymentRepository
//     .createQueryBuilder('payment')
//     .select('SUM(payment.amount)', 'total')
//     .where('payment.status = :status', { status: PaymentStatus.APPROVED })
//     .andWhere('payment.paidAt >= :start', { start: monthStart })
//     .andWhere('payment.paidAt <= :end', { end: now })
//     .getRawOne();

//   // Ingresos del mes pasado
//   const lastMonthRevenue = await this.paymentRepository
//     .createQueryBuilder('payment')
//     .select('SUM(payment.amount)', 'total')
//     .where('payment.status = :status', { status: PaymentStatus.APPROVED })
//     .andWhere('payment.paidAt >= :start', { start: lastMonthStart })
//     .andWhere('payment.paidAt < :end', { end: monthStart })
//     .getRawOne();

//   // Total de transacciones del mes
//   const transactionsCount = await this.paymentRepository.count({
//     where: {
//       status: PaymentStatus.APPROVED,
//       paidAt: Between(monthStart, now),
//     },
//   });

//   // Pagos fallidos del mes
//   const failedPayments = await this.paymentRepository.count({
//     where: {
//       status: PaymentStatus.FAILED,
//       createdAt: Between(monthStart, now),
//     },
//   });

//   // Calcular crecimiento
//   const currentRevenue = parseFloat(currentMonthRevenue?.total || 0);
//   const lastRevenue = parseFloat(lastMonthRevenue?.total || 0);
//   const growth =
//     lastRevenue > 0
//       ? ((currentRevenue - lastRevenue) / lastRevenue) * 100
//       : 0;

//   return {
//     currentMonth: {
//       revenue: currentRevenue,
//       transactions: transactionsCount,
//       failedPayments,
//     },
//     lastMonth: {
//       revenue: lastRevenue,
//     },
//     growth: parseFloat(growth.toFixed(2)),
//   };
// }

// // ============================================
// // INGRESOS POR PERÍODO
// // ============================================
// async getRevenue(
//   period: 'day' | 'week' | 'month' | 'year',
//   startDate?: string,
//   endDate?: string,
// ) {
//   const start = startDate
//     ? new Date(startDate)
//     : DateUtil.addMonth(DateUtil.nowUTC(), -12);
//   const end = endDate ? new Date(endDate) : DateUtil.nowUTC();

//   const query = this.paymentRepository
//     .createQueryBuilder('payment')
//     .select('DATE_TRUNC(:period, payment.paidAt)', 'period')
//     .addSelect('SUM(payment.amount)', 'revenue')
//     .addSelect('COUNT(*)', 'transactions')
//     .where('payment.status = :status', { status: PaymentStatus.APPROVED })
//     .andWhere('payment.paidAt BETWEEN :start AND :end', { start, end })
//     .groupBy('period')
//     .orderBy('period', 'ASC')
//     .setParameter('period', period);

//   const results = await query.getRawMany();

//   return results.map((r) => ({
//     period: r.period,
//     revenue: parseFloat(r.revenue),
//     transactions: parseInt(r.transactions),
//   }));
// }

// // ============================================
// // HISTORIAL DE PAGOS DE UN USUARIO
// // ============================================
// async getUserPayments(userId: string, page: number, limit: number) {
//   const skip = (page - 1) * limit;

//   const [payments, total] = await this.paymentRepository.findAndCount({
//     where: { userId },
//     order: { createdAt: 'DESC' },
//     skip,
//     take: limit,
//   });

//   return {
//     data: payments,
//     meta: {
//       page,
//       limit,
//       total,
//       totalPages: Math.ceil(total / limit),
//     },
//   };
// }

// // ============================================
// // PAGOS RECIENTES (ADMIN)
// // ============================================
// async getRecentPayments(page: number, limit: number) {
//   const skip = (page - 1) * limit;

//   const [payments, total] = await this.paymentRepository.findAndCount({
//     relations: ['user'],
//     order: { createdAt: 'DESC' },
//     skip,
//     take: limit,
//   });

//   return {
//     data: payments,
//     meta: {
//       page,
//       limit,
//       total,
//       totalPages: Math.ceil(total / limit),
//     },
//   };
// }

// // ============================================
// // PAGOS FALLIDOS
// // ============================================
// async getFailedPayments() {
//   const monthStart = DateUtil.getStartOfMonth();

//   return await this.paymentRepository.find({
//     where: {
//       status: PaymentStatus.FAILED,
//       createdAt: MoreThanOrEqual(monthStart),
//     },
//     relations: ['user'],
//     order: { createdAt: 'DESC' },
//   });
// }

// // ============================================
// // RECIBO DE PAGO
// // ============================================
// async getPaymentReceipt(userId: string, paymentId: string) {
//   const payment = await this.paymentRepository.findOne({
//     where: { id: paymentId, userId },
//     relations: ['user', 'subscription'],
//   });

//   if (!payment) {
//     throw new NotFoundException('Pago no encontrado');
//   }

//   // Retornar info del recibo
//   return {
//     paymentId: payment.id,
//     amount: payment.amount,
//     currency: payment.currency,
//     status: payment.status,
//     paidAt: payment.paidAt,
//     method: payment.paymentMethod,
//     user: {
//       name: `${payment.user.name} ${payment.user.lastName}`,
//       email: payment.user.email,
//     },
//     period: {
//       start: payment.periodStart,
//       end: payment.periodEnd,
//     },
//     receiptUrl: payment.receiptUrl || null,
//   };
// }
// }
