import { EstadoUsuario, TipoUsuario } from '../entities/user.entity';
export declare class CreateUserDto {
    email: string;
    password: string;
    nombre: string;
    apellido: string;
    tipo?: TipoUsuario;
    estado?: EstadoUsuario;
}
