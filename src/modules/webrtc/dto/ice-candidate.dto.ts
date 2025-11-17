import { IsString, IsNotEmpty } from 'class-validator';

export class IceCandidateDto {
  @IsString()
  @IsNotEmpty()
  roomId!: string;

  @IsString()
  @IsNotEmpty()
  targetUserId!: string;

  @IsNotEmpty()
  candidate!: any;
}
