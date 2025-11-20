import { Injectable } from '@nestjs/common';
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
      return { success: false, statusCode: 400 };
    }

    const seguidor = await this.usuarioRepo.findOne({
      where: { id: idSeguidor },
    });
    const seguido = await this.usuarioRepo.findOne({
      where: { id: idSeguido },
    });

    if (!seguidor || !seguido) {
      return { success: false, statusCode: 404 };
    }

    const existe = await this.followRepo.findOne({
      where: {
        follower: { id: idSeguidor },
        following: { id: idSeguido },
      },
    });

    if (existe) {
      return { success: false, statusCode: 400 };
    }

    const follow = this.followRepo.create({
      follower: seguidor,
      following: seguido,
    });

    await this.followRepo.save(follow);

    this.eventEmitter.emit('user.followed', {
      sender: seguidor,
      receiver: seguido,
    });

    return { success: true };
  }

  async dejarDeSeguir(idSeguidor: string, idSeguido: string) {
    const follow = await this.followRepo.findOne({
      where: {
        follower: { id: idSeguidor },
        following: { id: idSeguido },
      },
    });

    if (!follow) return { success: false, statusCode: 404 };

    await this.followRepo.remove(follow);
    return { success: true };
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
      return { success: false, statusCode: 404 };
    }

    if (requestUserId !== idSeguidor && userRole !== UserRole.ADMIN) {
      return { success: false, statusCode: 403 };
    }

    await this.followRepo.remove(follow);
    return { success: true };
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
      return { success: false, statusCode: 404 };
    }

    if (requestUserId !== idSeguido && userRole !== UserRole.ADMIN) {
      return { success: false, statusCode: 403 };
    }

    await this.followRepo.remove(follow);
    return { success: true };
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
