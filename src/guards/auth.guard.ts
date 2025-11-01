import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import {
  RequestWithUser,
  UserPayload,
} from 'src/interfaces/request-with-user.interface';
import { envs } from 'src/config/envs.config';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request: RequestWithUser = context.switchToHttp().getRequest();
    const authorization = request.headers['authorization'] as string;
    const token = this.obtainTokenFromAuthorization(authorization);
    const payload: UserPayload = this.validateToken(token);
    request.user = {
      ...payload,
    };
    return true;
  }

  private obtainTokenFromAuthorization(authorization: string): string {
    const token = authorization?.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Bearer token not foud');
    }
    return token;
  }

  private validateToken(token: string): UserPayload {
    try {
      const secret = envs.jwt.secret;
      return this.jwtService.verify<UserPayload>(token, { secret });
    } catch (error) {
      console.error('Error validating token', error);
      throw new UnauthorizedException('Invalid token', error as Error);
    }
  }
}
