import { Repository } from 'typeorm';
import { Usuario, EstadoUsuario, TipoUsuario } from './entities/user.entity';
export declare class UserService {
    private readonly userRepository;
    constructor(userRepository: Repository<Usuario>);
    create(data: Partial<Usuario>): Promise<Usuario>;
    findAll(page?: number, limit?: number, filters?: {
        nombre?: string;
        tipo?: TipoUsuario;
        estado?: EstadoUsuario;
    }): Promise<{
        data: Usuario[];
        total: number;
    }>;
    findOne(id: string): Promise<Usuario>;
    update(id: string, data: Partial<Usuario>): Promise<Usuario>;
    softDelete(id: string): Promise<{
        message: string;
    }>;
    restore(id: string): Promise<{
        message: string;
    }>;
    hardDelete(id: string, userRole: TipoUsuario): Promise<{
        message: string;
    }>;
}
