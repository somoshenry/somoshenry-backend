import { Controller, Post, Delete, Get, Param } from '@nestjs/common';
import { FollowService } from './follow.service';

@Controller('follows')
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @Post(':idSeguidor/:idSeguido')
  seguir(@Param('idSeguidor') idSeguidor: string, @Param('idSeguido') idSeguido: string) {
    return this.followService.seguirUsuario(idSeguidor, idSeguido);
  }

  @Delete(':idSeguidor/:idSeguido')
  dejarDeSeguir(@Param('idSeguidor') idSeguidor: string, @Param('idSeguido') idSeguido: string) {
    return this.followService.dejarDeSeguir(idSeguidor, idSeguido);
  }

  @Get('seguidores/:idUsuario')
  obtenerSeguidores(@Param('idUsuario') idUsuario: string) {
    return this.followService.obtenerSeguidores(idUsuario);
  }

  @Get('siguiendo/:idUsuario')
  obtenerSiguiendo(@Param('idUsuario') idUsuario: string) {
    return this.followService.obtenerSiguiendo(idUsuario);
  }
}
