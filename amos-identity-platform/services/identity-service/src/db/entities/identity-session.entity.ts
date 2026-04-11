import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type SessionStatus = 'created' | 'processing' | 'approved' | 'review' | 'rejected';

@Entity('identity_sessions')
export class IdentitySession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'varchar', length: 2 })
  country!: string;

  @Column({ type: 'varchar', length: 256, nullable: true })
  reference!: string | null;

  @Column({ type: 'varchar', length: 32, default: 'created' })
  status!: SessionStatus;

  @Column({ type: 'jsonb', nullable: true })
  documentData!: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  faceData!: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  riskData!: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  decision!: 'approve' | 'review' | 'reject' | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  riskScore!: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
