import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Cohorte } from './entities/cohorte.entity';
import { CohorteMember } from './entities/cohorte-member.entity';
import { CohorteMaterial } from './entities/cohorte-material.entity';

import { User } from '../../user/entities/user.entity';

import { CohorteController } from './cohorte.controller';
import { CohorteService } from './cohorte.service';

import { CohorteMaterialsController } from './cohorte-materials.controller';
import { CohorteMaterialsService } from './cohorte-materials.service';

import { NotificationModule } from '../../notifications/socket/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Cohorte,
      CohorteMember,
      User,
      CohorteMaterial,
    ]),
    forwardRef(() => NotificationModule),
  ],
  controllers: [
    CohorteController,
    CohorteMaterialsController,
  ],
  providers: [
    CohorteService,
    CohorteMaterialsService,
  ],
  exports: [
    CohorteService,
    CohorteMaterialsService,
  ],
})
export class CohorteModule {}

