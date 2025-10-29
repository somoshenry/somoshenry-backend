import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Follow } from './entities/follow.entity';
import { Usuario } from '../user/entities/user.entity';

@Injectable()
export class FollowService {
  constructor(
    @InjectRepository(Follow)
    private followRepo: Repository<Follow>,
    @InjectRepository(Usuario)
    private usuarioRepo: Repository<Usuario>,
  ) {}

  async seguirUsuario(idSeguidor: string, idSeguido: string) {
    if (idSeguidor === idSeguido) {
      throw new BadRequestException('No puedes seguirte a ti mismo');
    }

    const seguidor = await this.usuarioRepo.findOne({ where: { id: idSeguidor } });
    const seguido = await this.usuarioRepo.findOne({ where: { id: idSeguido } });

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

    const follow = this.followRepo.create({ follower: seguidor, following: seguido });
    return this.followRepo.save(follow);
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
