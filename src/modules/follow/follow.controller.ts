import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  applyDecorators,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { FollowService } from './follow.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { SwaggerFollowDocs } from './docs/follow.swagger';

@ApiTags('Follows')
@Controller('follows')
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @Post(':idSeguido')
  @UseGuards(JwtAuthGuard)
  @applyDecorators(...SwaggerFollowDocs.seguir)
  seguir(
    @Req() req: Request & { user: { id: string } },
    @Param('idSeguido') idSeguido: string,
  ) {
    const idSeguidor = req.user.id;
    return this.followService.seguirUsuario(idSeguidor, idSeguido);
  }

  // Unfollow: the authenticated user stops following idSeguido
  @Delete('unfollow/:idSeguido')
  @UseGuards(JwtAuthGuard)
  @applyDecorators(...SwaggerFollowDocs.dejarDeSeguir)
  dejarDeSeguir(
    @Req() req: Request & { user: { id: string } },
    @Param('idSeguido') idSeguido: string,
  ) {
    const idSeguidor = req.user.id;
    return this.followService.dejarDeSeguirByFollower(idSeguidor, idSeguido);
  }

  // Remove follower: the authenticated user removes someone who follows them
  @Delete('remove-follower/:idSeguidor')
  @UseGuards(JwtAuthGuard)
  @applyDecorators(...SwaggerFollowDocs.removeFollower)
  removeFollower(
    @Req() req: Request & { user: { id: string } },
    @Param('idSeguidor') idSeguidor: string,
  ) {
    const idSeguido = req.user.id;
    return this.followService.removeFollower(idSeguido, idSeguidor);
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
