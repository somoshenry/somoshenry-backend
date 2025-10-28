import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { EstadoUsuario, TipoUsuario } from './entities/user.entity';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    create(dto: CreateUserDto): Promise<{
        message: string;
        user: import("./entities/user.entity").Usuario;
    }>;
    findAll(page?: number, limit?: number, nombre?: string, tipo?: TipoUsuario, estado?: EstadoUsuario): Promise<{
        message: string;
        total: number;
        usuarios: import("./entities/user.entity").Usuario[];
    }>;
    findOne(id: string): Promise<{
        message: string;
        user: import("./entities/user.entity").Usuario;
    }>;
    update(id: string, dto: UpdateUserDto): Promise<{
        message: string;
        user: import("./entities/user.entity").Usuario;
    }>;
    softDelete(id: string): Promise<{
        message: string;
    }>;
    restore(id: string): Promise<{
        message: string;
    }>;
    hardDelete(id: string, req: any): Promise<{
        message: string;
    }>;
}
