import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { Usuario } from '../../user/entities/user.entity';

@Entity('follows')
export class Follow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Usuario, (usuario) => usuario.siguiendo, { onDelete: 'CASCADE' })
  follower: Usuario;

  @ManyToOne(() => Usuario, (usuario) => usuario.seguidores, { onDelete: 'CASCADE' })
  following: Usuario;

  @CreateDateColumn()
  creadoEn: Date;
}
