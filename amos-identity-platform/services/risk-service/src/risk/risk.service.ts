import { Injectable, Logger } from '@nestjs/common';
import { ScoreDto } from './dto/score.dto';
import { DuplicateDetector } from './duplicate-detector';

export type Decision = 'approve' | 'review' | 'reject';

export interface RiskResult {
  sessionId: string;
  riskScore: number;          // 0..100, higher = riskier
  decision: Decision;
  reasons: string[];
  signals: Record<string, number>;
  scoredAt: string;
}

interface ScoringWeights {
  faceMismatch: number;
  lowLiveness: number;
  documentInvalid: number;
  documentExpired: number;
  underAge: number;
  lowOcrConfidence: number;
  duplicate: number;
}

const WEIGHTS: ScoringWeights = {
  faceMismatch: 45,
  lowLiveness: 30,
  documentInvalid: 20,
  documentExpired: 25,
  underAge: 50,
  lowOcrConfidence: 10,
  duplicate: 40,
};

@Injectable()
export class RiskService {
  private readonly logger = new Logger(RiskService.name);

  constructor(private readonly dupes: DuplicateDetector) {}

  async score(dto: ScoreDto): Promise<RiskResult> {
    const signals: Record<string, number> = {};
    const reasons: string[] = [];
    let score = 0;

    // --- face signals ----------------------------------------------------
    if (!dto.face.match.matched) {
      const delta = Math.max(0, dto.face.match.threshold - dto.face.match.similarity);
      const s = Math.min(WEIGHTS.faceMismatch, WEIGHTS.faceMismatch * (delta / dto.face.match.threshold + 0.5));
      signals.faceMismatch = round(s);
      score += s;
      reasons.push(`face similarity ${dto.face.match.similarity.toFixed(2)} below threshold ${dto.face.match.threshold}`);
    }

    if (!dto.face.liveness.passed) {
      const s = WEIGHTS.lowLiveness * (1 - dto.face.liveness.score);
      signals.lowLiveness = round(s);
      score += s;
      reasons.push(`liveness score ${dto.face.liveness.score.toFixed(2)} below 0.6`);
    }

    // --- document signals ------------------------------------------------
    const validation = dto.document.validation;
    if (validation) {
      if (validation.expired) {
        signals.documentExpired = WEIGHTS.documentExpired;
        score += WEIGHTS.documentExpired;
        reasons.push('document expired');
      }
      if (validation.underAge) {
        signals.underAge = WEIGHTS.underAge;
        score += WEIGHTS.underAge;
        reasons.push('holder is under 18');
      }
      if (!validation.valid && validation.issues.length > 0 && !validation.expired && !validation.underAge) {
        signals.documentInvalid = WEIGHTS.documentInvalid;
        score += WEIGHTS.documentInvalid;
        reasons.push(`document invalid: ${validation.issues.join(', ')}`);
      }
    }

    if (typeof dto.document.confidence === 'number' && dto.document.confidence < 0.7) {
      const s = WEIGHTS.lowOcrConfidence * (0.7 - dto.document.confidence);
      signals.lowOcrConfidence = round(s);
      score += s;
      reasons.push(`ocr confidence low (${dto.document.confidence.toFixed(2)})`);
    }

    // --- duplicate detection --------------------------------------------
    const fields = dto.document.fields as Record<string, string | undefined>;
    if (fields?.documentNumber) {
      const fingerprint = `${fields.documentNumber}|${fields.dateOfBirth ?? ''}`;
      const isDup = await this.dupes.isDuplicate(fingerprint);
      if (isDup) {
        signals.duplicate = WEIGHTS.duplicate;
        score += WEIGHTS.duplicate;
        reasons.push('duplicate identity detected');
      }
    }

    // clamp and decide
    const riskScore = Math.min(100, Math.round(score));
    const decision: Decision = riskScore >= 70 ? 'reject' : riskScore >= 35 ? 'review' : 'approve';

    this.logger.log(`session ${dto.sessionId} -> score=${riskScore} decision=${decision}`);

    return {
      sessionId: dto.sessionId,
      riskScore,
      decision,
      reasons,
      signals,
      scoredAt: new Date().toISOString(),
    };
  }
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
