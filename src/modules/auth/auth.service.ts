import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from './module-users/user.repository';
import { GoogleProfileDto } from './dto/google-profile.dto';
import { UserEntity } from './module-users/user.entity';
import { PayloadJwt } from './dto/payload-jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { CredentialDto } from './dto/credential.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userRepository: UserRepository,
    private userServide: UserService,
  ) {}

  generateToken(googleProfile: GoogleProfileDto): string {
    this.validateGoogleProfileDto(googleProfile);
    const userEntity = this.mapToUserEntity(googleProfile);
    const userFindOrCreated = this.userRepository.findOrAddUser(userEntity);
    const payload = this.mapToPayloadJwt(userFindOrCreated);
    return this.generateJwt(payload);
  }

  async registerUser(createUserDto: UserEntity): Promise<UserEntity> {
    const hashedPassword = await this.hashPassword(createUserDto.password);
    const user: UserEntity = { ...createUserDto, password: hashedPassword };
    this.userRepository.create(user);
    return user;
  }

  async login(credential: CredentialDto): Promise<string> {
    const user = this.userRepository.findUserByEmail(credential.username);
    if (!user) throw new BadRequestException('Username or pass invalid');
    const isPasswordValid = await bcrypt.compare(
      credential.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Username or pass invalid');
    }
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles,
    });
    return token;
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

  private mapToUserEntity(googleProfile: GoogleProfileDto): UserEntity {
    const userEntity = new UserEntity();
    userEntity.email = googleProfile.email;
    userEntity.name = googleProfile.name;
    userEntity.firstName = googleProfile.given_name;
    userEntity.lastName = googleProfile.family_name;
    userEntity.picture = googleProfile.picture;
    return userEntity;
  }

  private mapToPayloadJwt(user: UserEntity) {
    const payload: PayloadJwt = {
      sub: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles,
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
  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }
}
