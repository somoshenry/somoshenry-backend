import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { CredentialDto } from './dto/credential.dto';
import { Usuario } from '../user/entities/user.entity';
import { PayloadJwt } from './dto/payload-jwt';
import { LoginResponseOkDto } from './dto/login.response.ok.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userServide: UserService,
  ) {}

  async registerUser(user: Usuario): Promise<Usuario> {
    const hashedPassword = await this.hashPassword(user.password as string);
    const newUser: Usuario = { ...user, password: hashedPassword };
    return this.userServide.create(newUser);
  }

  async login(credential: CredentialDto): Promise<LoginResponseOkDto> {
    const user = this.findUserByEmail(credential.username);
    await this.validatePassword(credential.password, user.password as string);
    const payload = this.mapToPayloadJwt(user);
    const token = this.jwtService.sign(payload);
    return this.buildLoginResponseOkDto(token);
  }

  verifyToken(token: string): any {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token', error as Error);
    }
  }

  private findUserByEmail(email: string) {
    const user = this.userServide.findUserByEmail(email);
    if (!user) throw new BadRequestException('Username or pass invalid');
    return user;
  }

  private buildLoginResponseOkDto(token: string) {
    const response = new LoginResponseOkDto();
    response.token = token;
    return response;
  }

  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }
  private mapToPayloadJwt(user: Usuario) {
    const payload: PayloadJwt = {
      sub: user.id,
      email: user.email,
      name: user.nombre as string,
    };
    return payload;
  }
  private async validatePassword(
    password: string,
    passwordDb: string,
  ): Promise<void> {
    const isPasswordValid = await bcrypt.compare(password, passwordDb);
    if (!isPasswordValid) {
      throw new BadRequestException('Username or pass invalid');
    }
  }
}
