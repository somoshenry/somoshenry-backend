import { Controller, Post, Delete, Get, Param, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';
import { FollowService } from './follow.service';
import { AuthProtected } from '../auth/decorator/auth-protected.decorator';
import { UserRole, User } from '../user/entities/user.entity';

@ApiTags('Follows')
@Controller('follows')
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @Post(':idSeguido')
  @ApiOperation({ summary: 'Seguir a un usuario existente' })
  @ApiResponse({
    status: 201,
    description: 'Usuario seguido correctamente',
    schema: { example: { message: 'Usuario seguido correctamente' } },
  })
  @ApiResponse({
    status: 400,
    description: 'No se puede seguir a uno mismo o usuario inexistente',
  })
  @ApiBearerAuth('JWT-auth')
  @AuthProtected(UserRole.MEMBER, UserRole.TEACHER, UserRole.ADMIN)
  async seguir(
    @Req() req: Request & { user: { id: string; role: UserRole } },
    @Param('idSeguido') idSeguido: string,
  ): Promise<{ message: string }> {
    const idSeguidor = req.user.id;
    const result = (await this.followService.seguirUsuario(
      idSeguidor,
      idSeguido,
    )) as { message?: string; mensaje?: string };
    return { message: result.message ?? result.mensaje ?? 'Usuario seguido' };
  }

  @Delete('unfollow/:idSeguido')
  @ApiOperation({ summary: 'Dejar de seguir a un usuario' })
  @ApiResponse({
    status: 200,
    description: 'Dejaste de seguir al usuario correctamente',
    schema: {
      example: { message: 'Dejaste de seguir al usuario correctamente' },
    },
  })
  @ApiBearerAuth('JWT-auth')
  @AuthProtected(UserRole.MEMBER, UserRole.TEACHER, UserRole.ADMIN)
  async dejarDeSeguir(
    @Req() req: Request & { user: { id: string; role: UserRole } },
    @Param('idSeguido') idSeguido: string,
  ): Promise<{ message: string }> {
    const idSeguidor = req.user.id;
    const result = (await this.followService.dejarDeSeguirByFollower(
      idSeguidor,
      idSeguido,
    )) as { message?: string; mensaje?: string };
    return {
      message:
        result.message ?? result.mensaje ?? 'Dejaste de seguir al usuario',
    };
  }

  @Delete('remove-follower/:idSeguidor')
  @ApiOperation({ summary: 'Eliminar un seguidor (bloquearlo)' })
  @ApiResponse({
    status: 200,
    description: 'Seguidor eliminado correctamente',
    schema: { example: { message: 'Seguidor eliminado correctamente' } },
  })
  @ApiBearerAuth('JWT-auth')
  @AuthProtected(UserRole.MEMBER, UserRole.TEACHER, UserRole.ADMIN)
  async removeFollower(
    @Req() req: Request & { user: { id: string; role: UserRole } },
    @Param('idSeguidor') idSeguidor: string,
  ): Promise<{ message: string }> {
    const idSeguido = req.user.id;
    const result = (await this.followService.removeFollower(
      idSeguido,
      idSeguidor,
    )) as { message?: string; mensaje?: string };
    return {
      message: result.message ?? result.mensaje ?? 'Seguidor eliminado',
    };
  }

  @Get('seguidores/:idUsuario')
  @ApiOperation({ summary: 'Obtener todos los seguidores de un usuario' })
  @ApiResponse({
    status: 200,
    description: 'Lista de seguidores obtenida exitosamente',
    type: [User],
  })
  async obtenerSeguidores(
    @Param('idUsuario') idUsuario: string,
  ): Promise<User[]> {
    return this.followService.obtenerSeguidores(idUsuario);
  }

  @Get('siguiendo/:idUsuario')
  @ApiOperation({ summary: 'Obtener a quiénes sigue un usuario' })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios seguidos obtenida exitosamente',
    type: [User],
  })
  async obtenerSiguiendo(
    @Param('idUsuario') idUsuario: string,
  ): Promise<User[]> {
    return this.followService.obtenerSiguiendo(idUsuario);
  }

  @Get('seguidores/:idUsuario/count')
  @ApiOperation({ summary: 'Contar la cantidad de seguidores' })
  @ApiResponse({
    status: 200,
    description: 'Cantidad de seguidores obtenida exitosamente',
    schema: { example: { count: 42 } },
  })
  async contarSeguidores(
    @Param('idUsuario') idUsuario: string,
  ): Promise<{ count: number }> {
    const count = await this.followService.contarSeguidores(idUsuario);
    return { count };
  }

  @Get('siguiendo/:idUsuario/count')
  @ApiOperation({ summary: 'Contar a cuántos usuarios sigue un usuario' })
  @ApiResponse({
    status: 200,
    description: 'Cantidad de seguidos obtenida exitosamente',
    schema: { example: { count: 25 } },
  })
  async contarSiguiendo(
    @Param('idUsuario') idUsuario: string,
  ): Promise<{ count: number }> {
    const count = await this.followService.contarSiguiendo(idUsuario);
    return { count };
  }
}
