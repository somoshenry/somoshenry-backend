import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  applyDecorators,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { FollowService } from './follow.service';
import { AuthProtected } from '../auth/decorator/auth-protected.decorator';
import { UserRole } from '../user/entities/user.entity';
import { SwaggerFollowDocs } from './docs/follow.swagger';

@ApiTags('Follows')
@Controller('follows')
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @Post(':idSeguido')
  @applyDecorators(...SwaggerFollowDocs.seguir)
  @AuthProtected(UserRole.MEMBER, UserRole.TEACHER, UserRole.ADMIN)
  seguir(
    @Req() req: Request & { user: { id: string; role: UserRole } },
    @Param('idSeguido') idSeguido: string,
  ) {
    const idSeguidor = req.user.id;
    return this.followService.seguirUsuario(idSeguidor, idSeguido);
  }

  @Delete('unfollow/:idSeguido')
  @applyDecorators(...SwaggerFollowDocs.dejarDeSeguir)
  @AuthProtected(UserRole.MEMBER, UserRole.TEACHER, UserRole.ADMIN)
  dejarDeSeguir(
    @Req() req: Request & { user: { id: string; role: UserRole } },
    @Param('idSeguido') idSeguido: string,
  ) {
    const idSeguidor = req.user.id;
    return this.followService.dejarDeSeguirByFollower(idSeguidor, idSeguido);
  }

  @Delete('remove-follower/:idSeguidor')
  @applyDecorators(...SwaggerFollowDocs.removeFollower)
  @AuthProtected(UserRole.MEMBER, UserRole.TEACHER, UserRole.ADMIN)
  removeFollower(
    @Req() req: Request & { user: { id: string; role: UserRole } },
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
