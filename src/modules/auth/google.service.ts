import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PayloadJwt } from './dto/payload-jwt';
import { UserService } from '../user/user.service';

@Injectable()
export class GoogleService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
  ) {}

  generateToken(googleProfile: GoogleProfileDto): string {
    this.validateGoogleProfileDto(googleProfile);
    const user = this.mapToUsuario(googleProfile);
    const userFindOrCreated = this.userService.findOrAddUser(user);
    const payload = this.mapToPayloadJwt(userFindOrCreated);
    return this.generateJwt(payload);
  }

  verifyToken(token: string): any {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token', error as Error);
    }
  }

  private validateGoogleProfileDto(googleProfileDto: GoogleProfileDto) {
    if (!googleProfileDto)
      throw new UnauthorizedException('Google no envió datos de usuario');
    if (!googleProfileDto.verified_email)
      throw new UnauthorizedException('Email not verified');
  }

  private mapToUsuario(googleProfile: GoogleProfileDto): Usuario {
    const user = new Usuario();
    user.email = googleProfile.email;
    user.nombre = googleProfile.name;
    user.apellido = googleProfile.family_name;
    user.imagenPerfil = googleProfile.picture;
    return user;
  }

  private mapToPayloadJwt(user: Usuario) {
    const payload: PayloadJwt = {
      sub: user.id,
      email: user.email,
      name: user.nombre as string,
    };
    return payload;
  }
  private generateJwt(payload: PayloadJwt): string {
    try {
      return this.jwtService.sign(payload);
    } catch (error) {
      console.log('Error al generar el jwt', error);
      throw error;
    }
  }
}
import { GoogleProfileDto } from './dto/google-profile.dto';
import { Usuario } from '../user/entities/user.entity';
