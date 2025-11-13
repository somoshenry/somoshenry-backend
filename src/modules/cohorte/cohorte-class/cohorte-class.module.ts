import { Module } from '@nestjs/common';
import { CohorteClassService } from './cohorte-class.service';
import { CohorteClassController } from './cohorte-class.controller';

import { TypeOrmModule } from '@nestjs/typeorm';
import { CohorteClass } from './entities/cohorte-class.entity';
import { ClassAttendance } from './entities/class-attendance.entity';
import { Cohorte } from '../cohorte/entities/cohorte.entity';
import { CohorteMember } from '../cohorte/entities/cohorte-member.entity';
import { User } from '../../user/entities/user.entity';
import { AttendanceService } from './attendance.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CohorteClass,
      ClassAttendance,
      Cohorte,
      CohorteMember,
      User,
    ]),
  ],
  controllers: [CohorteClassController],
  providers: [CohorteClassService, AttendanceService],
  exports: [AttendanceService],
})
export class CohorteClassModule {}
