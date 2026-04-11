import { IsISO31661Alpha2, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSessionDto {
  @IsISO31661Alpha2()
  country!: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  reference?: string;
}
