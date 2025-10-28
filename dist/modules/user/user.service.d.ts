import { Repository } from 'typeorm';
import { Usuario } from './entities/user.entity';
export declare class UserService {
    private readonly userRepository;
    constructor(userRepository: Repository<Usuario>);
    create(data: Partial<Usuario>): Promise<Usuario>;
    findAll(): Promise<Usuario[]>;
    findOne(id: string): Promise<Usuario>;
    update(id: string, data: Partial<Usuario>): Promise<Usuario>;
    delete(id: string): Promise<{
        message: string;
    }>;
}
