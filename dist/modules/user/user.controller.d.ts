import { UserService } from './user.service';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    create(data: any): Promise<{
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
    update(id: string, data: any): Promise<{
        message: string;
        user: import("./entities/user.entity").Usuario;
    }>;
    delete(id: string): Promise<{
        message: string;
    }>;
}
