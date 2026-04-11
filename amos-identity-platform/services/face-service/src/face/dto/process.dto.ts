import { IsString, IsUUID } from 'class-validator';

export class ProcessDto {
  @IsUUID()
  sessionId!: string;

  @IsString()
  documentKey!: string;

  @IsString()
  selfieKey!: string;
}
