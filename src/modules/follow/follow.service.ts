import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Follow } from './entities/follow.entity';
import { User, UserRole } from '../user/entities/user.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class FollowService {
  constructor(
    @InjectRepository(Follow)
    private followRepo: Repository<Follow>,
    @InjectRepository(User)
    private usuarioRepo: Repository<User>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async seguirUsuario(idSeguidor: string, idSeguido: string) {
    if (idSeguidor === idSeguido) {
      throw new BadRequestException('No puedes seguirte a ti mismo');
    }

    const seguidor = await this.usuarioRepo.findOne({
      where: { id: idSeguidor },
    });
    const seguido = await this.usuarioRepo.findOne({
      where: { id: idSeguido },
    });

    if (!seguidor || !seguido) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const existe = await this.followRepo.findOne({
      where: {
        follower: { id: idSeguidor },
        following: { id: idSeguido },
      },
    });

    if (existe) {
      throw new BadRequestException('Ya sigues a este usuario');
    }

    const follow = this.followRepo.create({
      follower: seguidor,
      following: seguido,
    });

    const savedFollow = await this.followRepo.save(follow);

    // 🔔 Emitimos el evento del nuevo seguidor
    this.eventEmitter.emit('user.followed', {
      sender: seguidor,
      receiver: seguido,
    });

    return savedFollow;
  }

  async dejarDeSeguir(idSeguidor: string, idSeguido: string) {
    const follow = await this.followRepo.findOne({
      where: {
        follower: { id: idSeguidor },
        following: { id: idSeguido },
      },
    });

    if (!follow) throw new NotFoundException('No sigues a este usuario');

    await this.followRepo.remove(follow);
    return { mensaje: 'Has dejado de seguir a este usuario' };
  }

  async dejarDeSeguirByFollower(
    idSeguidor: string,
    idSeguido: string,
    requestUserId: string,
    userRole: UserRole,
  ) {
    const follow = await this.followRepo.findOne({
      where: {
        follower: { id: idSeguidor },
        following: { id: idSeguido },
      },
    });

    if (!follow) {
      throw new NotFoundException('No sigues a este usuario');
    }

    if (requestUserId !== idSeguidor && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'No tienes permiso para dejar de seguir por otro usuario',
      );
    }

    await this.followRepo.remove(follow);
    return { mensaje: 'Has dejado de seguir a este usuario' };
  }

  async removeFollower(
    idSeguido: string,
    idSeguidor: string,
    requestUserId: string,
    userRole: UserRole,
  ) {
    const follow = await this.followRepo.findOne({
      where: {
        follower: { id: idSeguidor },
        following: { id: idSeguido },
      },
    });

    if (!follow) {
      throw new NotFoundException('Este usuario no te sigue');
    }

    if (requestUserId !== idSeguido && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'No tienes permiso para eliminar este seguidor',
      );
    }

    await this.followRepo.remove(follow);
    return { mensaje: 'Seguidor eliminado correctamente' };
  }

  async obtenerSeguidores(idUsuario: string) {
    const seguidores = await this.followRepo.find({
      where: { following: { id: idUsuario } },
      relations: ['follower'],
    });
    return seguidores.map((f) => f.follower);
  }

  async obtenerSiguiendo(idUsuario: string) {
    const siguiendo = await this.followRepo.find({
      where: { follower: { id: idUsuario } },
      relations: ['following'],
    });
    return siguiendo.map((f) => f.following);
  }

  async contarSeguidores(idUsuario: string): Promise<number> {
    return this.followRepo.count({
      where: { following: { id: idUsuario } },
    });
  }

  async contarSiguiendo(idUsuario: string): Promise<number> {
    return this.followRepo.count({
      where: { follower: { id: idUsuario } },
    });
  }
}
