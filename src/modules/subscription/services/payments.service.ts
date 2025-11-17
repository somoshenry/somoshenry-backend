import { InjectRepository } from '@nestjs/typeorm';
import { Payment } from '../entities/payment.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Between, MoreThanOrEqual, Repository } from 'typeorm';
import { DateUtil } from 'src/common/utils/date.util';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  private readonly MP_STATUS = {
    APPROVED: 'approved',
    REJECTED: 'rejected',
    PENDING: 'pending',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded',
  } as const;

  // ============================================
  // HISTORIAL DE PAGOS DE UN USUARIO
  // ============================================
  async getUserPayments(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [payments, total] = await this.paymentRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: payments,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ============================================
  // RECIBO DE PAGO
  // ============================================
  async getPaymentReceipt(userId: string, paymentId: string) {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId, userId },
      relations: ['user', 'subscription'],
    });

    if (!payment) {
      throw new NotFoundException('Pago no encontrado');
    }

    // Retornar info del recibo
    return {
      paymentId: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      paidAt: payment.paidAt,
      method: payment.paymentMethod,
      user: {
        name: `${payment.user.name} ${payment.user.lastName}`,
        email: payment.user.email,
      },
      period: {
        start: payment.periodStart,
        end: payment.periodEnd,
      },
      receiptUrl: payment.receiptUrl || null,
    };
  }

  // ============================================
  // ESTADÍSTICAS DE PAGOS DE UN USUARIO
  // ============================================
  async getUserPaymentStats(userId: string) {
    const payments = await this.paymentRepository.find({
      where: { userId },
    });

    // Si no hay pagos
    if (payments.length === 0) {
      return {
        total: 0,
        approved: 0,
        failed: 0,
        pending: 0,
        cancelled: 0,
        refunded: 0,
        totalSpent: 0,
        totalRefunded: 0,
        averagePayment: 0,
        lastPayment: null,
        paymentMethods: [],
        monthlyStats: null,
      };
    }

    // Contadores por estado
    const approved = payments.filter((p) => p.status === 'approved').length;
    const failed = payments.filter((p) => p.status === 'rejected').length;
    const pending = payments.filter((p) => p.status === 'pending').length;
    const cancelled = payments.filter((p) => p.status === 'cancelled').length;
    const refunded = payments.filter((p) => p.status === 'refunded').length;

    // Total gastado (solo aprobados)
    const totalSpent = payments
      .filter((p) => p.status === 'approved')
      .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

    // Total reembolsado
    const totalRefunded = payments
      .filter((p) => p.refundedAmount)
      .reduce((sum, p) => sum + parseFloat(p.refundedAmount.toString()), 0);

    // Promedio de pago
    const averagePayment = approved > 0 ? totalSpent / approved : 0;

    // Último pago
    const sortedPayments = [...payments].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    const lastPayment = sortedPayments[0];

    // Métodos de pago usados
    const methodsUsed = [
      ...new Set(
        payments.filter((p) => p.paymentMethod).map((p) => p.paymentMethod),
      ),
    ];

    const paymentMethodsStats = methodsUsed.map((method) => ({
      method,
      count: payments.filter((p) => p.paymentMethod === method).length,
    }));

    // Stats del mes actual
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthPayments = payments.filter((p) => p.createdAt >= monthStart);
    const monthlySpent = monthPayments
      .filter((p) => p.status === 'approved')
      .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

    return {
      // Totales
      total: payments.length,
      approved,
      failed,
      pending,
      cancelled,
      refunded,

      // Montos
      totalSpent: parseFloat(totalSpent.toFixed(2)),
      totalRefunded: parseFloat(totalRefunded.toFixed(2)),
      averagePayment: parseFloat(averagePayment.toFixed(2)),

      // Último pago
      lastPayment: {
        id: lastPayment.id,
        amount: lastPayment.amount,
        status: lastPayment.status,
        method: lastPayment.paymentMethod,
        date: lastPayment.createdAt,
      },

      // Métodos de pago
      paymentMethods: paymentMethodsStats,

      // Este mes
      monthlyStats: {
        payments: monthPayments.length,
        spent: parseFloat(monthlySpent.toFixed(2)),
      },
    };
  }

  // ============================================
  // ADMIN
  // ============================================

  // ============================================
  // ESTADÍSTICAS GENERALES
  // ============================================
  async getGeneralStats() {
    const now = DateUtil.nowUTC();
    const monthStart = DateUtil.getStartOfMonth();
    const lastMonthStart = DateUtil.addMonth(monthStart, -1);

    // Ingresos del mes actual
    const currentMonthRevenue = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.status = :status', { status: this.MP_STATUS.APPROVED })
      .andWhere('payment.paidAt >= :start', { start: monthStart })
      .andWhere('payment.paidAt <= :end', { end: now })
      .getRawOne();

    // Ingresos del mes pasado
    const lastMonthRevenue = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.status = :status', { status: this.MP_STATUS.APPROVED })
      .andWhere('payment.paidAt >= :start', { start: lastMonthStart })
      .andWhere('payment.paidAt < :end', { end: monthStart })
      .getRawOne();

    // Total de transacciones del mes
    const transactionsCount = await this.paymentRepository.count({
      where: {
        status: this.MP_STATUS.APPROVED,
        paidAt: Between(monthStart, now),
      },
    });

    // Pagos fallidos del mes
    const failedPayments = await this.paymentRepository.count({
      where: {
        status: this.MP_STATUS.REJECTED,
        createdAt: Between(monthStart, now),
      },
    });

    // Calcular crecimiento
    const currentRevenue = parseFloat(currentMonthRevenue?.total || 0);
    const lastRevenue = parseFloat(lastMonthRevenue?.total || 0);
    const growth =
      lastRevenue > 0
        ? ((currentRevenue - lastRevenue) / lastRevenue) * 100
        : 0;

    return {
      currentMonth: {
        revenue: currentRevenue,
        transactions: transactionsCount,
        failedPayments,
      },
      lastMonth: {
        revenue: lastRevenue,
      },
      growth: parseFloat(growth.toFixed(2)),
    };
  }

  // ============================================
  // INGRESOS POR PERÍODO
  // ============================================
  async getRevenue(
    period: 'day' | 'week' | 'month' | 'year',
    startDate?: string,
    endDate?: string,
  ) {
    const start = startDate
      ? new Date(startDate)
      : DateUtil.addMonth(DateUtil.nowUTC(), -12);
    const end = endDate ? new Date(endDate) : DateUtil.nowUTC();

    const query = this.paymentRepository
      .createQueryBuilder('payment')
      .select('DATE_TRUNC(:period, payment.paidAt)', 'period')
      .addSelect('SUM(payment.amount)', 'revenue')
      .addSelect('COUNT(*)', 'transactions')
      .where('payment.status = :status', { status: this.MP_STATUS.APPROVED })
      .andWhere('payment.paidAt BETWEEN :start AND :end', { start, end })
      .groupBy('period')
      .orderBy('period', 'ASC')
      .setParameter('period', period);

    const results = await query.getRawMany();

    return results.map((r) => ({
      period: r.period,
      revenue: parseFloat(r.revenue),
      transactions: parseInt(r.transactions),
    }));
  }

  // ============================================
  // PAGOS RECIENTES
  // ============================================
  async getRecentPayments(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [payments, total] = await this.paymentRepository.findAndCount({
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: payments,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ============================================
  // PAGOS FALLIDOS
  // ============================================
  async getFailedPayments() {
    const monthStart = DateUtil.getStartOfMonth();

    return await this.paymentRepository.find({
      where: {
        status: this.MP_STATUS.REJECTED,
        createdAt: MoreThanOrEqual(monthStart),
      },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }
}
