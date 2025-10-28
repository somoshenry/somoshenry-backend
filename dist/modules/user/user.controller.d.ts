import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    create(dto: CreateUserDto): Promise<{
        message: string;
        user: import("./entities/user.entity").Usuario;
    }>;
    findAll(): Promise<{
        message: string;
        users: import("./entities/user.entity").Usuario[];
    }>;
    findOne(id: string): Promise<{
        message: string;
        user: import("./entities/user.entity").Usuario;
    }>;
    update(id: string, dto: UpdateUserDto): Promise<{
        message: string;
        user: import("./entities/user.entity").Usuario;
    }>;
    delete(id: string): Promise<{
        message: string;
    }>;
}
