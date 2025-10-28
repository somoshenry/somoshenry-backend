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
    {
      id: '123456788',
      email: 'canomartin0812@gmail.com',
      name: 'Martin',
      firstName: 'Martin',
      lastName: 'Martin',
      picture: 'Imagen',
      roles: ['user', 'admin'],
    },
    {
      id: '123456787',
      email: 'leopaz@unicauca.edu.co',
      name: 'Leonardo',
      firstName: 'Leonardo',
      lastName: 'Leonardo',
      picture: 'Imagen',
      roles: ['user', 'admin'],
    },
    {
      id: '123456786',
      email: 'MauroA1517@gmail.com',
      name: 'Mauro',
      firstName: 'Mauro',
      lastName: 'Mauro',
      picture: 'Imagen',
      roles: ['user', 'admin'],
    },
    {
      id: '123456785',
      email: 'tareas_rotceh@hotmail.com',
      name: 'Rotceh',
      firstName: 'Rotceh',
      lastName: 'Rotceh',
      picture: 'Imagen',
      roles: ['user', 'admin'],
    },
    {
      id: '123456784',
      email: 'Valentinsk8r9er@gmail.com',
      name: 'Valentin',
      firstName: 'Valentin',
      lastName: 'Valentin',
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
