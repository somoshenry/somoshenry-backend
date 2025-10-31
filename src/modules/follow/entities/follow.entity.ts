import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('follows')
export class Follow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (usuario) => usuario.following, {
    onDelete: 'CASCADE',
  })
  follower: User;

  @ManyToOne(() => User, (usuario) => usuario.followers, {
    onDelete: 'CASCADE',
  })
  following: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
