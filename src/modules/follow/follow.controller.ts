import { Controller, Post, Delete, Get, Param, applyDecorators } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FollowService } from './follow.service';
import { SwaggerFollowDocs } from './docs/follow.swagger';

@ApiTags('Follows')
@Controller('follows')
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @Post(':idSeguidor/:idSeguido')
  @applyDecorators(...SwaggerFollowDocs.seguir)
  seguir(
    @Param('idSeguidor') idSeguidor: string,
    @Param('idSeguido') idSeguido: string,
  ) {
    return this.followService.seguirUsuario(idSeguidor, idSeguido);
  }

  @Delete(':idSeguidor/:idSeguido')
  @applyDecorators(...SwaggerFollowDocs.dejarDeSeguir)
  dejarDeSeguir(
    @Param('idSeguidor') idSeguidor: string,
    @Param('idSeguido') idSeguido: string,
  ) {
    return this.followService.dejarDeSeguir(idSeguidor, idSeguido);
  }

  @Get('seguidores/:idUsuario')
  @applyDecorators(...SwaggerFollowDocs.obtenerSeguidores)
  obtenerSeguidores(@Param('idUsuario') idUsuario: string) {
    return this.followService.obtenerSeguidores(idUsuario);
  }

  @Get('siguiendo/:idUsuario')
  @applyDecorators(...SwaggerFollowDocs.obtenerSiguiendo)
  obtenerSiguiendo(@Param('idUsuario') idUsuario: string) {
    return this.followService.obtenerSiguiendo(idUsuario);
  }

  @Get('seguidores/:idUsuario/count')
  @applyDecorators(...SwaggerFollowDocs.contarSeguidores)
  contarSeguidores(@Param('idUsuario') idUsuario: string) {
    return this.followService.contarSeguidores(idUsuario);
  }

  @Get('siguiendo/:idUsuario/count')
  @applyDecorators(...SwaggerFollowDocs.contarSiguiendo)
  contarSiguiendo(@Param('idUsuario') idUsuario: string) {
    return this.followService.contarSiguiendo(idUsuario);
  }
}
