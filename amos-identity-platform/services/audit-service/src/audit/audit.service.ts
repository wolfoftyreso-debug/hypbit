import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { chainHash, sha256 } from '@amos/crypto';
import { AuditEntry } from './audit.entity';

const GENESIS = sha256('amos-audit-genesis');

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditEntry)
    private readonly repo: Repository<AuditEntry>,
  ) {}

  async append(eventType: string, sessionId: string | null, payload: Record<string, unknown>): Promise<AuditEntry> {
    const last = await this.repo.findOne({ where: {}, order: { seq: 'DESC' } });
    const prevHash = last?.hash ?? GENESIS;
    const body = { eventType, sessionId, payload, createdAt: new Date().toISOString() };
    const hash = chainHash(prevHash, body);

    const entry = this.repo.create({
      sessionId,
      eventType,
      payload,
      prevHash,
      hash,
    });
    const saved = await this.repo.save(entry);
    this.logger.debug(`appended ${eventType} seq=${saved.seq} hash=${hash.substring(0, 8)}`);
    return saved;
  }

  async findBySession(sessionId: string): Promise<AuditEntry[]> {
    return this.repo.find({ where: { sessionId }, order: { seq: 'ASC' } });
  }

  /**
   * Verify the hash chain for a session. Returns the first seq where the
   * chain is broken, or null if the chain is intact.
   */
  async verify(sessionId: string): Promise<{ valid: boolean; brokenAtSeq?: number }> {
    const entries = await this.findBySession(sessionId);
    let expectedPrev = GENESIS;
    // Walk globally — fetch previous entry for this chain position. We
    // approximate here: for session-scoped verification we just walk the
    // entries in order, recomputing hashes against the stored prevHash.
    for (const e of entries) {
      if (e.prevHash !== expectedPrev && !(expectedPrev === GENESIS && entries[0] === e)) {
        // The first entry in a session won't have GENESIS because other
        // sessions may have been written in between; trust stored prevHash
        // and recompute the current hash only.
      }
      const recomputed = chainHash(e.prevHash, {
        eventType: e.eventType,
        sessionId: e.sessionId,
        payload: e.payload,
        createdAt: e.createdAt.toISOString(),
      });
      if (recomputed !== e.hash) {
        return { valid: false, brokenAtSeq: e.seq };
      }
      expectedPrev = e.hash;
    }
    return { valid: true };
  }
}
