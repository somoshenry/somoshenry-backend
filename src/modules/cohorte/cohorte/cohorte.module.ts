import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cohorte } from './entities/cohorte.entity';
import { CohorteMember } from './entities/cohorte-member.entity';
import { CohorteService } from './cohorte.service';
import { CohorteController } from './cohorte.controller';
import { User } from '../../user/entities/user.entity';
import { CohorteMaterial } from './entities/cohorte-material.entity';
import { CohorteMaterialsService } from './cohorte-materials.service';
import { CohorteMaterialsController } from './cohorte-materials.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cohorte, CohorteMember, User, CohorteMaterial]),
  ],
  controllers: [CohorteController, CohorteMaterialsController],
  providers: [CohorteService, CohorteMaterialsService],
  exports: [CohorteService, CohorteMaterialsService],
})
export class CohorteModule {}
