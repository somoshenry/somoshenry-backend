import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Report } from './entities/report.entity';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { PostModule } from '../post/post.module';

@Module({
  imports: [TypeOrmModule.forFeature([Report]), PostModule],
  controllers: [ReportController],
  providers: [ReportService],
})
export class ReportModule {}
