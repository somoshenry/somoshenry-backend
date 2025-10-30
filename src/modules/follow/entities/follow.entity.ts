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

  @ManyToOne(() => User, (usuario) => usuario.siguiendo, {
    onDelete: 'CASCADE',
  })
  follower: User;

  @ManyToOne(() => User, (usuario) => usuario.seguidores, {
    onDelete: 'CASCADE',
  })
  following: User;

  @CreateDateColumn()
  creadoEn: Date;
}
