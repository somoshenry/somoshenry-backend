import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { CredentialDto } from './dto/credential.dto';
import { User } from '../user/entities/user.entity';
import { PayloadJwt } from './dto/payload-jwt';
import { LoginResponseOkDto } from './dto/login.response.ok.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
  ) {}

  async registerUser(user: Partial<User>): Promise<User> {
    const hashedPassword = await this.hashPassword(user.password as string);
    const newUser = { ...user, password: hashedPassword };
    return this.userService.create(newUser);
  }

  async login(credential: CredentialDto): Promise<LoginResponseOkDto> {
    const user = await this.findUserByEmail(credential.username);
    await this.validatePassword(credential.password, user.password as string);
    const payload = this.mapToPayloadJwt(user);
    const token = this.jwtService.sign(payload);
    return this.buildLoginResponseOkDto(token);
  }

  async updatePassword(
    email: string,
    password: string,
  ): Promise<{ message: string }> {
    try {
      await this.findUserByEmail(email);
      const hashedPassword = await this.hashPassword(password);
      const updateUser = new User();
      updateUser.password = hashedPassword;
      await this.userService.updateByEmail(email, updateUser);
      return { message: 'Update successful' };
    } catch (err) {
      console.error('Error to change password ', err);
      throw new UnauthorizedException(err);
    }
  }

  verifyToken(token: string): PayloadJwt {
    try {
      return this.jwtService.verify<PayloadJwt>(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token', error as Error);
    }
  }

  private async findUserByEmail(email: string) {
    const user = await this.userService.findUserByEmailWithPassword(email);
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
  private mapToPayloadJwt(user: User): PayloadJwt {
    const payload: PayloadJwt = {
      sub: user.id,
      email: user.email,
      name: user.nombre as string,
      type: user.tipo,
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
