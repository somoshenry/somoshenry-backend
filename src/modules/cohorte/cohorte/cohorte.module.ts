import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cohorte } from './entities/cohorte.entity';
import { CohorteMember } from './entities/cohorte-member.entity';
import { CohorteService } from './cohorte.service';
import { CohorteController } from './cohorte.controller';
import { User } from '../../user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cohorte, CohorteMember, User])],
  controllers: [CohorteController],
  providers: [CohorteService],
  exports: [CohorteService],
})
export class CohorteModule {}
