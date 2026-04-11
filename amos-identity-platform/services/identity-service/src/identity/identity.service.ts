import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { NotFoundError, KafkaProducer, ValidationError } from '@amos/utils';
import { IdentitySession } from '../db/entities/identity-session.entity';
import { CreateSessionDto } from './dto/create-session.dto';
import { StorageService } from './storage.service';
import { AuthService } from '../auth/auth.service';
import { KAFKA_PRODUCER } from '../kafka/kafka.module';

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
    const session = await this.getSessionOrFail(id);
    const key = `sessions/${id}/document.jpg`;
    await this.storage.put(key, image, 'image/jpeg');

    // Call document-service for OCR.
    const docUrl = this.config.get<string>('identity.services.documentUrl')!;
    const { data } = await axios.post(`${docUrl}/document/extract`, {
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
    const key = `sessions/${id}/selfie.jpg`;
    await this.storage.put(key, image, 'image/jpeg');

    const faceUrl = this.config.get<string>('identity.services.faceUrl')!;
    const { data } = await axios.post(`${faceUrl}/face/process`, {
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
    const { data } = await axios.post(`${riskUrl}/risk/score`, {
      sessionId: id,
      document: session.documentData,
      face: session.faceData,
    });

    session.riskData = data;
    session.riskScore = data.riskScore;
    session.decision = data.decision;
    session.status = data.decision === 'approve' ? 'approved' : data.decision === 'reject' ? 'rejected' : 'review';
    await this.sessions.save(session);

    await this.producer.publish('identity.verified', id, {
      sessionId: id,
      decision: session.decision,
      riskScore: session.riskScore,
      reasons: data.reasons,
    });

    return {
      id: session.id,
      decision: session.decision,
      riskScore: session.riskScore,
      reasons: data.reasons,
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
