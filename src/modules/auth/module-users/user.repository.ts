import { Injectable } from '@nestjs/common';
import { UserEntity } from './user.entity';

@Injectable()
export class UserRepository {
  users: UserEntity[] = [
    {
      id: '123456789',
      email: 'jhonny.berdeja.100@gmail.com',
      name: 'Jhonny Berdeja',
      firstName: 'Jhonny',
      lastName: 'Berdeja',
      picture: 'Imagen',
      roles: ['user', 'admin'],
    },
  ];
  findUserByEmail(email: string) {
    return this.users.find((u) => u.email === email);
  }
  findOrAddUser(user: UserEntity) {
    // si existe actualizar el lastLogin
    return this.findUserByEmail(user.email) as UserEntity; //buscar o crear el usuario si no existe
  }
}
