import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { OneToMany } from 'typeorm';
import { Follow } from '../../follow/entities/follow.entity';
import { Post } from '../../post/entities/post.entity';

export enum TipoUsuario {
  ADMINISTRADOR = 'ADMINISTRADOR',
  DOCENTE = 'DOCENTE',
  MIEMBRO = 'MIEMBRO',
}

export enum EstadoUsuario {
  ACTIVO = 'ACTIVO',
  SUSPENDIDO = 'SUSPENDIDO',
  ELIMINADO = 'ELIMINADO',
}

@Entity({ name: 'usuarios' })
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Exclude()
  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  password?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nombre?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  apellido?: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  imagenPerfil?: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  imagenPortada?: string | null;

  @Column({ type: 'text', nullable: true })
  biografia?: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  ubicacion?: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  sitioWeb?: string | null;

  @Column({ type: 'timestamp without time zone', nullable: true })
  fechaIngreso?: Date | null;

  @Column({ type: 'enum', enum: TipoUsuario, default: TipoUsuario.MIEMBRO })
  tipo: TipoUsuario;

  @Column({ type: 'enum', enum: EstadoUsuario, default: EstadoUsuario.ACTIVO })
  estado: EstadoUsuario;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn: Date;

  @UpdateDateColumn({ name: 'actualizado_en' })
  actualizadoEn: Date;

  @DeleteDateColumn({ name: 'eliminado_en', nullable: true })
  eliminadoEn?: Date | null;

  @OneToMany(() => Follow, (follow) => follow.follower)
  siguiendo: Follow[];

  @OneToMany(() => Follow, (follow) => follow.following)
  seguidores: Follow[];
  @OneToMany(() => Post, (post) => post.user)
  posts: Post[];
}
