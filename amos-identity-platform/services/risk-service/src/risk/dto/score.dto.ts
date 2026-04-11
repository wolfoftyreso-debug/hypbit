import { IsObject, IsUUID } from 'class-validator';

export class ScoreDto {
  @IsUUID()
  sessionId!: string;

  @IsObject()
  document!: {
    fields: Record<string, unknown>;
    validation?: {
      valid: boolean;
      issues: string[];
      expired: boolean;
      underAge: boolean;
    };
    confidence?: number;
  };

  @IsObject()
  face!: {
    match: { similarity: number; matched: boolean; threshold: number };
    liveness: { score: number; passed: boolean };
  };
}
