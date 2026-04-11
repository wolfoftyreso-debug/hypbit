import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('audit_log')
@Index(['sessionId', 'createdAt'])
export class AuditEntry {
  @PrimaryGeneratedColumn('increment')
  seq!: number;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  sessionId!: string | null;

  @Column({ type: 'varchar', length: 128 })
  eventType!: string;

  @Column({ type: 'jsonb' })
  payload!: Record<string, unknown>;

  @Column({ type: 'varchar', length: 64 })
  prevHash!: string;

  @Column({ type: 'varchar', length: 64 })
  hash!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
