import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../user/entities/user.entity';

export class ReportedPostDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: () => User })
  user: User;

  @ApiProperty()
  reportsCount: number;

  @ApiProperty({ nullable: true })
  lastReportAt: Date | null;
}

export class PaginationMetaDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  hasNextPage: boolean;

  @ApiProperty()
  hasPreviousPage: boolean;
}

export class ReportedPostsResponseDto {
  @ApiProperty({ type: [ReportedPostDto] })
  data: ReportedPostDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
