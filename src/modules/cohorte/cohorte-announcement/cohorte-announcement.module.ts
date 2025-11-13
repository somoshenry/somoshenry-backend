import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CohorteAnnouncement } from './entities/cohorte-announcement.entity';
import { CohorteAnnouncementService } from './cohorte-announcement.service';
import { CohorteAnnouncementController } from './cohorte-announcement.controller';
import { Cohorte } from '../cohorte/entities/cohorte.entity';
import { User } from '../../user/entities/user.entity';
import { CohorteMember } from '../cohorte/entities/cohorte-member.entity';
import { CohorteAnnouncementGateway } from './cohorte-announcement.gateway';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CohorteAnnouncement,
      Cohorte,
      User,
      CohorteMember,
    ]),
    forwardRef(() => AuthModule),
  ],
  controllers: [CohorteAnnouncementController],
  providers: [CohorteAnnouncementService, CohorteAnnouncementGateway],
  exports: [CohorteAnnouncementGateway],
})
export class CohorteAnnouncementModule {}
