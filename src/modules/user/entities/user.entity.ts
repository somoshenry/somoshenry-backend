import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Follow } from '../../follow/entities/follow.entity';
import { Post } from '../../post/entities/post.entity';
import { Comment } from '../../comment/entities/comment.entity';
import { Notification } from '../../notifications/socket/entities/notification.entity';
import { Subscription } from 'src/modules/subscription/entities/subscription.entity';
import { Payment } from 'src/modules/subscription/entities/payment.entity';
import { CohorteMember } from 'src/modules/cohorte/cohorte/entities/cohorte-member.entity';
import { CohorteMaterial } from 'src/modules/cohorte/cohorte/entities/cohorte-material.entity';

export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  MEMBER = 'MEMBER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
  BANNED = 'BANNED',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  username?: string | null;

  @Exclude()
  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  password?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName?: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  profilePicture?: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  coverPicture?: string | null;

  @Column({ type: 'text', nullable: true })
  biography?: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  location?: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  website?: string | null;

  @Column({ type: 'timestamp without time zone', nullable: true })
  joinDate?: Date | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.MEMBER })
  role: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date | null;

  @OneToMany(() => Follow, 'follower')
  following!: Follow[];

  @OneToMany(() => Follow, 'following')
  followers!: Follow[];

  @OneToMany(() => Post, 'user')
  posts!: Post[];

  @OneToMany(() => Comment, 'author')
  comments!: Comment[];

  @OneToMany(() => Notification, (notification) => notification.receiver)
  receivedNotifications: Notification[];

  @OneToMany(() => Notification, (notification) => notification.sender)
  sentNotifications: Notification[];

  @OneToOne(() => Subscription, (subscription) => subscription.user)
  subscription: Subscription;
  subscriptionPlan?: string;
  subscriptionExpiresAt?: Date | null;

  @OneToMany(() => Payment, (payment) => payment.user)
  payments: Payment[];

  @OneToMany(() => CohorteMember, (member) => member.user)
  cohorteMembers: CohorteMember[];

  @OneToMany(
    () => CohorteMaterial,
    (cohorteMaterial) => cohorteMaterial.uploader,
  )
  cohorteMaterial: CohorteMaterial[];
}
