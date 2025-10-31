import { TipoUsuario } from 'src/modules/user/entities/user.entity';

export interface PayloadJwt {
  sub: string;
  email: string;
  name: string;
  type: TipoUsuario;
}
