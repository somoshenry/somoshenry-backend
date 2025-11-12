import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SubscriptionService } from '../../modules/subscription/services/subscription.service';
import { Request } from 'express';

interface JwtPayload {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtAndPostLimitGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const authHeader: string | undefined = request.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token no provisto o mal formado');
    }

    const token: string = authHeader.split(' ')[1];
    let payload: JwtPayload;

    try {
      payload = this.jwtService.verify<JwtPayload>(token, {
        secret: process.env.JWT_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    // ✅ Cargar usuario en la request (para que otros decorators o guards lo usen)
    (request as any).user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    };

    // ✅ Verificar si el usuario puede publicar según su plan
    const canPost: boolean = await this.subscriptionService.canUserPost(
      payload.id,
    );

    if (!canPost) {
      // Ejecutar ambas promesas en paralelo
      const [remaining, plan] = await Promise.all([
        this.subscriptionService.getRemainingPosts(payload.id).catch(() => 0),
        this.subscriptionService
          .getUserPlan(payload.id)
          .catch(() => 'Desconocido'),
      ]);

      throw new ForbiddenException({
        message:
          'Has alcanzado el límite de publicaciones permitido por tu plan',
        plan,
        remaining,
        upgradeUrl: '/subscription/upgrade',
      });
    }

    return true;
  }
}
