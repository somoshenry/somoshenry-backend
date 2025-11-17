import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Payment } from './payment.entity';

export enum SubscriptionPlan {
  BRONCE = 'BRONCE',
  PLATA = 'PLATA',
  ORO = 'ORO',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

@Entity('subscriptions')
export class Subscription {
  // IMPORTANTE: usar "timestamp with time zone" para manejar fechas en UTC
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;

  @OneToOne(() => User, (user) => user.subscription, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: SubscriptionPlan,
    default: SubscriptionPlan.BRONCE,
  })
  plan: SubscriptionPlan;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @Column({ name: 'start_date', type: 'timestamp with time zone' })
  startDate: Date;

  @Column({
    name: 'end_date',
    type: 'timestamp with time zone',
    nullable: true,
  })
  endDate: Date | null;

  @Column({
    name: 'next_billing_date',
    type: 'timestamp with time zone',
    nullable: true,
  })
  nextBillingDate: Date | null;

  @Column({ name: 'auto_renew', default: true })
  autoRenew: boolean;

  @Column({
    name: 'cancelled_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  cancelledAt: Date | null;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => Payment, (payment) => payment.subscription)
  payments: Payment[];
}
