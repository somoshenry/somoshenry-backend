import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import {
  RequestWithUser,
  UserPayload,
} from 'src/interfaces/request-with-user.interface';
import { UserRole } from 'src/modules/user/entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const requiredRoles = this.obtainDefinedRolesInDecorator(context);
    const user = this.getUserOfTheRequest(context);
    const hasRolePermitted = this.theUserHasRequiredRoles(requiredRoles, user);
    this.validateIfYouHavePermissionToAccessTheRoute(hasRolePermitted);
    return hasRolePermitted;
  }

  private obtainDefinedRolesInDecorator(context: ExecutionContext): UserRole[] {
    const roles: UserRole[] = this.reflector.getAllAndOverride<UserRole[]>(
      'roles',
      [context.getHandler(), context.getClass()],
    );
    return roles;
  }

  private getUserOfTheRequest(context: ExecutionContext): UserPayload {
    const request: RequestWithUser = context.switchToHttp().getRequest();
    if (!request || !request.user || !request.user.roles)
      throw new ForbiddenException('No user information found in request');
    const user: UserPayload = request.user;
    return user;
  }

  private theUserHasRequiredRoles(
    requiredRoles: UserRole[],
    user: UserPayload,
  ): boolean {
    return requiredRoles.some((role) => user.roles.includes(role));
  }

  private validateIfYouHavePermissionToAccessTheRoute(
    hasRolePermitted: boolean,
  ) {
    if (!hasRolePermitted) {
      throw new ForbiddenException(
        'No tienes permisos para acceder a esta ruta',
      );
    }
  }
}
