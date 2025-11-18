import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';
import { CohorteRoleEnum } from '../../cohorte/enums/cohorte.enums';

export class AddMemberRequestDto {
  @ApiProperty({
    description: 'Rol que tendrá el usuario dentro de la cohorte',
    enum: CohorteRoleEnum,
    example: CohorteRoleEnum.STUDENT,
  })
  @IsEnum(CohorteRoleEnum)
  role: CohorteRoleEnum;
}

export class AddMemberWithIdRequestDto extends AddMemberRequestDto {
  @ApiProperty({
    description: 'ID del usuario a agregar (usado en el body)',
    example: '550e8400-e29b-41d4-a716-446655440001',
    format: 'uuid',
  })
  @IsUUID()
  userId: string;
}
