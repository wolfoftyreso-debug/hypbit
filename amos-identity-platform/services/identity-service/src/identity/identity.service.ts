import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios, { AxiosInstance } from 'axios';
import { ConfigService } from '@nestjs/config';
import { NotFoundError, KafkaProducer, ValidationError } from '@amos/utils';
import { IdentitySession } from '../db/entities/identity-session.entity';
import { CreateSessionDto } from './dto/create-session.dto';
import { StorageService } from './storage.service';
import { AuthService } from '../auth/auth.service';
import { KAFKA_PRODUCER } from '../kafka/kafka.module';

// Hardened axios client used for ALL internal service-to-service calls.
// - 10s timeout so a stuck downstream cannot hang this service
// - 2 MiB max response size so a compromised/misbehaving service cannot
//   flood us with a gigabyte payload that then lands in our Postgres
//   JSONB columns
// - No redirect following to reduce SSRF surface
const internalHttp: AxiosInstance = axios.create({
  timeout: 10_000,
  maxRedirects: 0,
  maxContentLength: 2 * 1024 * 1024,
  maxBodyLength: 2 * 1024 * 1024,
  validateStatus: (s) => s >= 200 && s < 300,
});

// Minimal magic-byte detection for common image formats we accept. Stops
// attackers from stashing arbitrary blobs (scripts, executables, ZIPs)
// in the S3 bucket via the selfie/document upload endpoints.
function isLikelyImage(buf: Buffer): boolean {
  if (buf.length < 12) return false;
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return true;
  }
  // HEIC/HEIF: ftyp box at offset 4
  if (
    buf[4] === 0x66 &&
    buf[5] === 0x74 &&
    buf[6] === 0x79 &&
    buf[7] === 0x70
  ) {
    return true;
  }
  return false;
}

@Injectable()
export class IdentityService {
  private readonly logger = new Logger(IdentityService.name);

  constructor(
    @InjectRepository(IdentitySession)
    private readonly sessions: Repository<IdentitySession>,
    private readonly storage: StorageService,
    private readonly auth: AuthService,
    private readonly config: ConfigService,
    @Inject(KAFKA_PRODUCER) private readonly producer: KafkaProducer,
  ) {}

  async createSession(dto: CreateSessionDto) {
    const session = this.sessions.create({
      country: dto.country,
      reference: dto.reference ?? null,
      status: 'created',
    });
    const saved = await this.sessions.save(session);

    await this.producer.publish('identity.created', saved.id, {
      id: saved.id,
      country: saved.country,
      reference: saved.reference,
      createdAt: saved.createdAt,
    });

    return {
      id: saved.id,
      status: saved.status,
      createdAt: saved.createdAt,
      uploadToken: this.auth.issueUploadToken(saved.id),
    };
  }

  async uploadDocument(id: string, type: string, image: Buffer) {
    if (!['passport', 'id_card', 'driver_license'].includes(type)) {
      throw new ValidationError(`invalid document type: ${type}`);
    }
    if (!isLikelyImage(image)) {
      throw new ValidationError('uploaded file is not a supported image (jpeg/png/heic)');
    }
    const session = await this.getSessionOrFail(id);
    const key = `sessions/${id}/document.jpg`;
    await this.storage.put(key, image, 'image/jpeg');

    // Call document-service for OCR.
    const docUrl = this.config.get<string>('identity.services.documentUrl')!;
    const { data } = await internalHttp.post(`${docUrl}/document/extract`, {
      sessionId: id,
      s3Key: key,
      type,
    });

    session.status = 'processing';
    session.documentData = data;
    await this.sessions.save(session);

    await this.producer.publish('document.uploaded', id, {
      sessionId: id,
      type,
      s3Key: key,
      extracted: data,
    });

    return { accepted: true, sessionId: id, extracted: data };
  }

  async uploadSelfie(id: string, image: Buffer) {
    const session = await this.getSessionOrFail(id);
    if (!session.documentData) {
      throw new ValidationError('document must be uploaded before selfie');
    }
    if (!isLikelyImage(image)) {
      throw new ValidationError('uploaded file is not a supported image (jpeg/png/heic)');
    }
    const key = `sessions/${id}/selfie.jpg`;
    await this.storage.put(key, image, 'image/jpeg');

    const faceUrl = this.config.get<string>('identity.services.faceUrl')!;
    const { data } = await internalHttp.post(`${faceUrl}/face/process`, {
      sessionId: id,
      documentKey: `sessions/${id}/document.jpg`,
      selfieKey: key,
    });

    session.faceData = data;
    await this.sessions.save(session);

    await this.producer.publish('face.processed', id, {
      sessionId: id,
      s3Key: key,
      result: data,
    });

    return { accepted: true, sessionId: id, face: data };
  }

  async verify(id: string) {
    const session = await this.getSessionOrFail(id);
    if (!session.documentData || !session.faceData) {
      throw new ValidationError('document and selfie must be uploaded before verify');
    }

    const riskUrl = this.config.get<string>('identity.services.riskUrl')!;
    const { data } = await internalHttp.post(`${riskUrl}/risk/score`, {
      sessionId: id,
      document: session.documentData,
      face: session.faceData,
    });

    // Validate and sanitize the decision coming back from risk-service.
    // Never blindly trust an enum-valued field from an internal peer —
    // if risk-service were compromised it could try to smuggle arbitrary
    // status strings into our session table.
    const rawDecision = typeof data?.decision === 'string' ? data.decision : 'review';
    const decision: 'approve' | 'review' | 'reject' =
      rawDecision === 'approve' || rawDecision === 'reject' ? rawDecision : 'review';
    const rawScore = Number(data?.riskScore);
    const riskScore = Number.isFinite(rawScore) ? Math.min(100, Math.max(0, rawScore)) : 50;

    session.riskData = data;
    session.riskScore = riskScore;
    session.decision = decision;
    session.status = decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'review';
    await this.sessions.save(session);

    const safeReasons = Array.isArray(data?.reasons)
      ? (data.reasons as unknown[]).filter((r) => typeof r === 'string').slice(0, 32)
      : [];

    await this.producer.publish('identity.verified', id, {
      sessionId: id,
      decision: session.decision,
      riskScore: session.riskScore,
      reasons: safeReasons,
    });

    return {
      id: session.id,
      decision: session.decision,
      riskScore: session.riskScore,
      reasons: safeReasons,
    };
  }

  async status(id: string) {
    const s = await this.getSessionOrFail(id);
    return {
      id: s.id,
      status: s.status,
      document: s.documentData ? { uploaded: true, extracted: s.documentData } : { uploaded: false },
      face: s.faceData ?? { uploaded: false },
      risk: s.riskData ?? null,
    };
  }

  private async getSessionOrFail(id: string): Promise<IdentitySession> {
    const s = await this.sessions.findOne({ where: { id } });
    if (!s) throw new NotFoundError('Session', id);
    return s;
  }
}
