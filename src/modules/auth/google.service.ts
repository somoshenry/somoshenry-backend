import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PayloadJwt } from './dto/payload-jwt';
import { UserService } from '../user/user.service';
import { GoogleProfileDto } from './dto/google-profile.dto';
import { User } from '../user/entities/user.entity';

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
      throw new UnauthorizedException('Token inválido', error as Error);
    }
  }

  private validateGoogleProfileDto(googleProfileDto: GoogleProfileDto) {
    if (!googleProfileDto)
      throw new UnauthorizedException('Google no envió datos de usuario');
    if (!googleProfileDto.verified_email)
      throw new UnauthorizedException('Correo electrónico no verificado');
  }

  private mapToUsuario(googleProfile: GoogleProfileDto): User {
    const user = new User();
    user.email = googleProfile.email;
    user.name = googleProfile.name;
    user.lastName = googleProfile.family_name;
    user.profilePicture = googleProfile.picture;
    return user;
  }

  private mapToPayloadJwt(user: User) {
    const payload: PayloadJwt = {
      sub: user.id,
      email: user.email,
      name: user.name as string,
      role: user.role,
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
