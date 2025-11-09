import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorator/roles.decorator';
import { UserRole } from '../../user/entities/user.entity';
import { Request } from 'express';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const ctx = context.switchToHttp();
    const request = ctx.getRequest<
      Request & { user?: { id: string; role: UserRole } }
    >();

    if (!request.user) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    if (!request.user.role) {
      throw new UnauthorizedException('Usuario no tiene rol asignado');
    }

    const hasRole = requiredRoles.includes(request.user.role);
    if (!hasRole) {
      throw new UnauthorizedException(
        `El rol ${request.user.role} no tiene permiso para esta acción`,
      );
    }

    return true;
  }
}
