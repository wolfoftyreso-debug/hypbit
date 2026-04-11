import { registerAs } from '@nestjs/config';

export const identityConfig = registerAs('identity', () => ({
  port: Number(process.env.IDENTITY_SERVICE_PORT ?? 3000),
  kafka: {
    brokers: (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(','),
    clientId: `${process.env.KAFKA_CLIENT_ID_PREFIX ?? 'amos'}-identity`,
    groupId: 'amos-identity-consumer',
  },
  s3: {
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION ?? 'us-east-1',
    accessKey: process.env.S3_ACCESS_KEY ?? '',
    secretKey: process.env.S3_SECRET_KEY ?? '',
    bucket: process.env.S3_BUCKET ?? 'amos-identity',
    forcePathStyle: (process.env.S3_FORCE_PATH_STYLE ?? 'true') === 'true',
  },
  crypto: {
    piiKey: process.env.PII_ENCRYPTION_KEY ?? '',
    jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
    jwtIssuer: process.env.JWT_ISSUER ?? 'amos-identity',
    jwtAudience: process.env.JWT_AUDIENCE ?? 'amos-external',
  },
  services: {
    documentUrl: process.env.DOCUMENT_SERVICE_URL ?? 'http://document-service:3001',
    faceUrl: process.env.FACE_SERVICE_URL ?? 'http://face-service:3002',
    riskUrl: process.env.RISK_SERVICE_URL ?? 'http://risk-service:3003',
  },
}));
