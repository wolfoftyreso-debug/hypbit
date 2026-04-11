import { IsIn, IsString, IsUUID } from 'class-validator';

export class ExtractDto {
  @IsUUID()
  sessionId!: string;

  @IsString()
  s3Key!: string;

  @IsIn(['passport', 'id_card', 'driver_license'])
  type!: 'passport' | 'id_card' | 'driver_license';
}
