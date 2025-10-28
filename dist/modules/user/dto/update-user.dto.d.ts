import { CreateUserDto } from './create-user.dto';
import { EstadoUsuario, TipoUsuario } from '../entities/user.entity';
declare const UpdateUserDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateUserDto>>;
export declare class UpdateUserDto extends UpdateUserDto_base {
    email?: string;
    password?: string;
    nombre?: string;
    apellido?: string;
    tipo?: TipoUsuario;
    estado?: EstadoUsuario;
}
export {};
