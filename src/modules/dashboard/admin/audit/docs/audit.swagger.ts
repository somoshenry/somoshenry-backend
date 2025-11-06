import { ApiProperty } from '@nestjs/swagger';
import { AuditAction } from '../enums/audit-action.enum';

export class AuditLogDocs {
  @ApiProperty({ enum: AuditAction })
  action: AuditAction;

  @ApiProperty()
  targetType: string;

  @ApiProperty()
  targetId: string;

  @ApiProperty()
  adminId: string;

  @ApiProperty()
  createdAt: Date;
}
