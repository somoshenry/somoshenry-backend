import {
  Controller,
  Post,
  Body,
  HttpCode,
  applyDecorators,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../user/dto/create-user.dto'; // Asumo que este DTO existe
import { CredentialDto } from './dto/credential.dto'; // Asumo que este DTO existe
import { User } from '../user/entities/user.entity'; // Asumo que este Entity existe
import { LoginResponseOkDto } from './dto/login.response.ok.dto'; // Asumo que este DTO existe

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @HttpCode(201) // Código 201 Created para creación exitosa
  @ApiOperation({ summary: 'Registra un nuevo usuario en la plataforma.' })
  @ApiBody({
    type: CreateUserDto,
    description: 'Datos necesarios para la creación del usuario.',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario creado exitosamente.',
    type: User, // Muestra el esquema de la entidad Usuario como respuesta
  })
  @ApiResponse({
    status: 400,
    description:
      'Datos de entrada inválidos (ej. email duplicado o password débil).',
  })
  registerUser(@Body() user: CreateUserDto): Promise<User> {
    console.log(user);
    // Nota: El servicio debe mapear el DTO a la entidad User antes de guardar
    return this.authService.registerUser(user as User);
  }

  @Post('login')
  @HttpCode(200)
  @applyDecorators(...SwaggerAuthDocs.login)
  login(@Body() credenctial: CredentialDto): Promise<LoginResponseOkDto> {
    return this.authService.login(credenctial);
  }

  @Post('update-password')
  @HttpCode(200)
  @applyDecorators(...SwaggerAuthDocs.updatePassword)
  updatePassword(
    @Body() credenctial: CredentialDto,
  ): Promise<{ message: string }> {
    return this.authService.updatePassword(
      credenctial.username,
      credenctial.password,
    );
  }
}
